import { Event } from '@indent/types'
import { verify } from '@indent/webhook'
import {
  ApplyIntegration,
  ApplyUpdateRequest,
  BaseIntegration,
  BaseRequest,
  BaseResponse,
  DecisionIntegration,
  DecisionRequest,
  PullIntegration,
  PullUpdateRequest,
} from './types'

export * from './types'

export async function handleRequest(
  req: BaseRequest,
  ...integrations: BaseIntegration[]
): Promise<BaseResponse> {
  try {
    const { body, secret, headers } = req
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
          details: verifyErr,
        }
        return {
          status,
          response: {
            statusCode: 500,
            body: JSON.stringify({ status }),
            headers: { 'Content-Type': 'application/json' },
          },
        }
      }
    }

    const data = JSON.parse(body)
    const callType = getWebhookCallType(data)
    const matchedIntegrations = integrations.filter((ign) => {
      const info = ign.GetInfo()

      info.capabilities.includes(callType)
    })

    matchedIntegrations.map((_ign) => {
      if (callType === 'ApplyUpdate') {
        const ign = _ign as ApplyIntegration
        ign.ApplyUpdate(data as ApplyUpdateRequest)
      } else if (callType === 'PullUpdate') {
        const ign = _ign as PullIntegration
        ign.PullUpdate(data as PullUpdateRequest)
      } else if (callType === 'Decision') {
        const ign = _ign as DecisionIntegration
        ign.GetDecision(data as DecisionRequest)
      }
    })

    return {
      status: {},
      response: {
        body: '',
        headers: {},
        statusCode: 200,
      },
    }
  } catch (err) {
    // TODO: handle error
    return {
      status: { code: 10, message: 'Uncaught exception' },
    }
  }
}

function getWebhookCallType(data: any): string {
  if (data.kinds) {
    return 'PullUpdate'
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
