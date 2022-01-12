import {
  ApplyIntegration,
  ApplyUpdateRequest,
  BaseHttpIntegration,
  BaseHttpIntegrationOpts,
  HealthCheckResponse,
  IntegrationInfoResponse,
  StatusCode,
} from '@indent/base-webhook'
import { ApplyUpdateResponse, Event, Resource } from '@indent/types'
import { AxiosRequestConfig, AxiosResponse } from 'axios'
import { AtspokeRequest, AtspokeUser } from './atspoke-types'

const version = require('../package.json').version
const INDENT_SPACE_NAME = process.env.INDENT_SPACE_NAME || ''
const ATSPOKE_API_KEY = process.env.ATSPOKE_API_KEY || ''
const ATSPOKE_API_HOST =
  process.env.ATSPOKE_API_HOST || 'https://api.askspoke.com'

export class AtSpokeIntegration
  extends BaseHttpIntegration
  implements ApplyIntegration
{
  _name?: string

  constructor(opts?: BaseHttpIntegrationOpts) {
    super(opts)

    if (opts) {
      this._name = opts.name
    }
  }

  HealthCheck(): HealthCheckResponse {
    return { status: { code: 0 } }
  }

  GetInfo(): IntegrationInfoResponse {
    return {
      name: ['indent-atspoke-webhook', this._name].filter(Boolean).join('#'),
      capabilities: ['ApplyUpdate'],
      version,
    }
  }

  FetchAtSpoke(
    config: AxiosRequestConfig<any>
  ): Promise<AxiosResponse<any, any>> {
    config.baseURL = /http/.test(ATSPOKE_API_HOST)
      ? ATSPOKE_API_HOST
      : `https://${ATSPOKE_API_HOST}`
    config.headers = {
      'Api-Key': ATSPOKE_API_KEY,
      'Content-Type': 'application/json',
    }

    return this.Fetch(config)
  }

  MatchApply(_req: ApplyUpdateRequest): boolean {
    return true
  }

  async ApplyUpdate(req: ApplyUpdateRequest): Promise<ApplyUpdateResponse> {
    const auditEvent = req.events.find((e) => /grant|revoke/.test(e.event))
    const allEvents = req.events
    const requestBody = prepareRequest(auditEvent, allEvents)

    try {
      await this.FetchAtSpoke({
        method: 'POST',
        url: '/api/v1/requests',
        data: {
          ...requestBody,
        },
      })

      return { status: { code: StatusCode.OK } }
    } catch (err) {
      return {
        status: {
          code: StatusCode.UNKNOWN,
          message: err.message,
          details: err.stack,
        },
      }
    }
  }
}

async function prepareRequest(
  auditEvent: Event,
  allEvents: Event[]
): Promise<AtspokeRequest> {
  let targetActor = getTargetActor(auditEvent)
  let targetResource = getTargetResource(auditEvent)
  let targetActorLabel = getDisplayName(targetActor)
  let targetResourceLabel = getDisplayName(targetResource)
  let actionLabel = auditEvent.event === 'access/grant' ? 'Granted' : 'Revoked'
  let subject = `${targetActorLabel} / ${targetResource.kind} ${targetResourceLabel} · Access ${actionLabel}`
  let body = getBody(auditEvent, allEvents)
  let atspokeUser = (await this.FetchAtSpoke({
    method: 'GET',
    url: '/api/v1/whoami',
  }).then((r) => r.data)) as AtspokeUser

  if (!atspokeUser) {
    throw new Error('getAtspokeWhoami: not found')
  }

  let { user: requester } = atspokeUser

  return {
    requester,
    subject,
    body,

    team: '5ffe35b92142af0006d52807',
    requestType: '6000080fbc8dc50006e3d17c',
    requestTypeInfo: {
      answeredFields: [
        {
          // reason
          fieldId: 'e18e9750-5646-11eb-b4c3-1f3b0fa733e1',
          value:
            allEvents
              .filter((e) => e.event === 'access/request')
              .map((e) => e.reason)[0] || '',
        },
        // duration
        auditEvent.event === 'access/grant' && {
          fieldId: 'e18e9751-5646-11eb-b4c3-1f3b0fa733e1',
          value: dur(auditEvent),
        },
      ].filter(Boolean),
    },
  } as AtspokeRequest
}

function getDisplayName(r: Resource): string {
  return (
    r.displayName ||
    (r.labels ? r.labels['indent.com/profile/name/preferred'] : '') ||
    r.id
  )
}

function getTargetActor(auditEvent: Event): Resource {
  return auditEvent?.resources?.filter((r) => r.kind?.includes('user'))[0] || {}
}

function getTargetResource(auditEvent: Event): Resource {
  return (
    auditEvent?.resources?.filter((r) => !r.kind?.includes('user'))[0] || {}
  )
}

function getBody(auditEvent: Event, allEvents: Event[]) {
  let targetActor = getTargetActor(auditEvent)
  let targetResource = getTargetResource(auditEvent)

  let metaLabels = auditEvent?.meta?.labels || {}
  let actionLabel = auditEvent.event === 'access/grant' ? 'granted' : 'revoked'
  let indentURL = `https://indent.com/spaces/${INDENT_SPACE_NAME}/workflows/${metaLabels['indent.com/workflow/origin/id']}/runs/${metaLabels['indent.com/workflow/origin/run/id']}`

  return `
${allEvents
  .filter((e) => e.event === 'access/request')
  .map((e) => `*Request Reason:* ${e.reason}`)}

${allEvents
  .filter((e) => e.event != auditEvent.event && e.event === 'access/approve')
  .map(
    (e) =>
      `${e?.actor?.displayName}(${
        e?.actor?.email
      }) approved access to ${getDisplayName(targetActor)} (${
        targetActor?.email
      }) for ${targetResource?.kind} ${getDisplayName(
        targetResource
      )}${durationText(e)}.`
  )
  .join('\n')}

${auditEvent?.actor?.displayName} (${
    auditEvent?.actor?.email
  }) ${actionLabel} access to ${getDisplayName(targetActor)} (${
    targetActor?.email
  }) for ${targetResource?.kind} ${getDisplayName(targetResource)}.

View Workflow in Indent →
${indentURL}`.trim()
}

function durationText(event: Event) {
  return `${
    !event.meta?.labels?.['indent.com/time/duration'] ||
    event.meta?.labels?.['indent.com/time/duration'] === '-1ns'
      ? ' '
      : ' for '
  }${dur(event)}`
}

function dur(event: Event) {
  return !event.meta?.labels?.['indent.com/time/duration'] ||
    event.meta?.labels?.['indent.com/time/duration'] === '-1ns'
    ? 'until revoked'
    : event.meta?.labels?.['indent.com/time/duration']
}
