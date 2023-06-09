import {
  ApplyIntegration,
  ApplyUpdateRequest,
  BaseHttpIntegration,
  BaseHttpIntegrationOpts,
  HealthCheckResponse,
  IntegrationInfoResponse,
  StatusCode,
} from '@indent/base-integration'
import { ApplyUpdateResponse, Event, Resource } from '@indent/types'
import { AxiosRequestConfig, AxiosResponse } from 'axios'

const pkg = require('../package.json')

export const GITHUB_TOKEN = process.env.GH_TOKEN
export const GITHUB_ORG = process.env.GITHUB_ORG
export const GITHUB_REPO = process.env.GITHUB_REPO
export const INDENT_SPACE_NAME = process.env.INDENT_SPACE_NAME

export class GithubIssueIntegration
  extends BaseHttpIntegration
  implements ApplyIntegration
{
  _name?: string

  constructor(opts?: BaseHttpIntegrationOpts) {
    super(opts)
  }

  HealthCheck(): HealthCheckResponse {
    return { status: { code: 0 } }
  }

  GetInfo(): IntegrationInfoResponse {
    return {
      name: ['indent-github-issue-webhook', this._name]
        .filter(Boolean)
        .join('#'),
      capabilities: ['ApplyUpdate'],
      version: pkg.version,
    }
  }

  FetchGithub(
    config: AxiosRequestConfig<any>
  ): Promise<AxiosResponse<any, any>> {
    config.baseURL = `https://api.github.com`
    config.headers = {
      Accept: `application/vnd.github.v3+json`,
      Authorization: `token ${GITHUB_TOKEN}`,
    }
    return this.Fetch(config)
  }

  async ApplyUpdate(req: ApplyUpdateRequest): Promise<ApplyUpdateResponse> {
    const auditEvent = req.events.find((e) => /grant|revoke/.test(e.event))

    const issue = await prepareRequest(auditEvent, req.events)
    const response = await this.FetchGithub({
      method: 'POST',
      url: `/repos/${GITHUB_ORG}/${GITHUB_REPO}/issues`,
      data: issue,
    })

    if (response.status > 204) {
      return {
        status: {
          code: StatusCode.UNKNOWN,
          details: { errorData: response.data },
        },
      }
    }

    return { status: {} }
  }
}

type GithubIssueRequest = {
  title: string
  body: string
  labels?: string[]
  milestone?: number
  assignees?: string[]
}

async function prepareRequest(
  auditEvent: Event,
  allEvents: Event[]
): Promise<GithubIssueRequest> {
  let targetActor = getTargetActor(auditEvent)
  let targetResource = getTargetResource(auditEvent)
  let targetActorLabel = targetActor.email || targetActor.displayName
  let targetResourceLabel = getDisplayName(targetResource)
  let actionLabel = auditEvent.event === 'access/grant' ? 'Granted' : 'Revoked'
  let title = `${targetActorLabel} / ${targetResource.kind} ${targetResourceLabel} · Access ${actionLabel}`
  let body = getBody(auditEvent, allEvents)

  return {
    title,
    body,
  }
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
  let petName = metaLabels?.['indent.com/petition'] || metaLabels?.['petition']
  let actionLabel = auditEvent.event === 'access/grant' ? 'granted' : 'revoked'
  let indentURL = `https://indent.com/access/${INDENT_SPACE_NAME}/${petName}`

  return `
${allEvents
  .filter((e) => e.event === 'access/request')
  .map((e) => `*Request Reason:* ${e.reason}`)}

${allEvents
  .filter((e) => e.event != auditEvent.event && e.event === 'access/approve')
  .map(
    (e) =>
      `*${e?.actor?.displayName}(${
        e?.actor?.email
      })* approved access to *${getDisplayName(targetActor)} (${
        targetActor?.email
      })* for ${targetResource?.kind} ${getDisplayName(
        targetResource
      )}${durationText(e)}.`
  )
  .join('\n')}

*${auditEvent?.actor?.displayName} (${
    auditEvent?.actor?.email
  })* ${actionLabel} access to *${getDisplayName(targetActor)} (${
    targetActor?.email
  })* for ${targetResource?.kind} ${getDisplayName(targetResource)}.

[View Petition in Indent →|${indentURL}]`
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
