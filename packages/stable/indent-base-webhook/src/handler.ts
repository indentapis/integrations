import { Event, Status } from '@indent/types'
import { verify } from '@indent/webhook'
import { StatusCode } from '.'
import {
  ApplyIntegration,
  ApplyUpdateRequest,
  BaseHttpResponse,
  BaseIntegration,
  BaseRequest,
  BaseResponse,
  DecisionIntegration,
  DecisionRequest,
  PullIntegration,
  PullUpdateRequest,
} from './types'

export async function handleRequest(
  req: BaseRequest,
  ...integrations: BaseIntegration[]
): Promise<BaseResponse> {
  try {
    const { body, secret, headers } = req
    console.log('@indent/base-webhook: handleRequest: [REQ]')
    try {
      await verify({
        body,
        secret,
        headers: headers as { [header: string]: string | string[] },
      })
    } catch (verifyErr) {
      if (verifyErr) {
        const status = {
          code: 9,
          message: 'webhook failed: invalid signature - check webhook secret',
          details: [{ error: verifyErr.toString() }],
        }
        return {
          status,
          response: toResponse(status),
        }
      }
    }

    const data = JSON.parse(body)
    const callName = getWebhookCallName(data)

    console.log(
      '@indent/base-webhook: handleRequest: [REQ] webhookType: ' + callName
    )

    if (callName === 'GetInfo') {
      const status = {
        details: [{ integrations: integrations.map((ign) => ign.GetInfo()) }],
      }
      return {
        status,
        response: toResponse(status),
      }
    }

    const matchedIntegrations = integrations.filter((ign) => {
      const info = ign.GetInfo()
      if (!info.capabilities.includes(callName)) {
        return false
      } else if (callName === 'ApplyUpdate') {
        return (ign as ApplyIntegration).MatchApply(data as ApplyUpdateRequest)
      } else if (callName === 'PullUpdate') {
        return (ign as PullIntegration).MatchPull(data as PullUpdateRequest)
      } else if (callName === 'Decision') {
        return (ign as DecisionIntegration).MatchDecision(
          data as DecisionRequest
        )
      }

      return true
    })

    console.log('@indent/base-webhook: handleRequest: [REQ] integrations')
    console.log({ integrations, matchedIntegrations })

    if (matchedIntegrations.length === 0) {
      const status = {
        code: StatusCode.NOT_FOUND,
        message: 'webhook failed: no matched integrations',
        details: [
          {
            callName,
            matchedIntegrations,
            integrations: integrations.map((ign) => ign.GetInfo()),
          },
        ],
      }
      return {
        status,
        response: toResponse(status),
      }
    }

    const results = await Promise.all(
      matchedIntegrations.map((ign) => {
        switch (callName) {
          case 'ApplyUpdate':
            return (ign as ApplyIntegration).ApplyUpdate(
              data as ApplyUpdateRequest
            )
          case 'PullUpdate':
            return (ign as PullIntegration).PullUpdate(
              data as PullUpdateRequest
            )
          case 'Decision':
            return (ign as DecisionIntegration).GetDecision(
              data as DecisionRequest
            )
          default:
            return Promise.reject()
        }
      })
    )

    if (results.length > 0) {
      // TODO: Figure something out for multiple results
    }

    const { status = {}, ...rest } = results[0]

    console.log('@indent/base-webhook: handleRequest: [RES] success')
    console.log({ status })

    return {
      status,
      response: toResponse(status, rest),
    }
  } catch (err) {
    // TODO: handle error
    console.error('@indent/base-webhook: handleRequest: [ERR]')
    console.error(err)
    const status = {
      code: 10,
      message: 'Uncaught exception',
      details: [{ error: err.toString() }],
    }
    return {
      status,
      response: toResponse(status),
    }
  }
}
function getWebhookCallName(data: any): string {
  if (data.kinds) {
    return 'PullUpdate'
  }

  if (data.info) {
    return 'GetInfo'
  }

  if (data.events) {
    const eventList = data.events.map((e: Event) => e.event)

    // Check if there is a grant or revoke event
    // that means it's an ApplyUpdate request
    if (
      eventList.includes('access/grant') ||
      eventList.includes('access/revoke')
    ) {
      return 'ApplyUpdate'
    }

    return 'Decision'
  }

  // TODO: log unrecognized webhook call type
  return 'Unrecognized'
}
function toResponse(status: Status, rest?: any): BaseHttpResponse {
  return {
    statusCode: !status.code ? 200 : 500,
    body: JSON.stringify({ status, ...(rest || {}) }),
    headers: { 'Content-Type': 'application/json' },
  }
}
