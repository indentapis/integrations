import {
  ApplyIntegration,
  ApplyUpdateRequest,
  BaseHttpIntegration,
  BaseHttpIntegrationOpts,
  HealthCheckResponse,
  IntegrationInfoResponse,
  StatusCode,
  WriteRequest,
} from '@indent/base-webhook'
import { ApplyUpdateResponse, Resource } from '@indent/types'
import { AxiosRequestConfig, AxiosResponse } from 'axios'

const version = require('../package.json').version
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN || ''
const JIRA_USER_EMAIL = process.env.JIRA_USER_EMAIL || ''
const JIRA_INSTANCE_URL = process.env.JIRA_INSTANCE_URL || ''

export class JiraIntegration
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
      name: ['indent-jira-webhook', this._name].filter(Boolean).join('#'),
      capabilities: ['ApplyUpdate'],
      version,
    }
  }

  FetchJira(config: AxiosRequestConfig<any>): Promise<AxiosResponse<any, any>> {
    config.baseURL = /http/.test(JIRA_INSTANCE_URL)
      ? JIRA_INSTANCE_URL
      : `HTTPS://${JIRA_INSTANCE_URL}`
    config.auth = {
      username: JIRA_USER_EMAIL,
      password: JIRA_API_TOKEN,
    }
    return this.Fetch(config)
  }

  MatchApply(req: WriteRequest): boolean {
    return (
      req.events.filter((e) =>
        Boolean(
          e.resources?.filter((r) =>
            r.kind?.toLowerCase().includes('jira.v1.projectrole')
          ).length
        )
      ).length > 0
    )
  }

  async ApplyUpdate(req: ApplyUpdateRequest): Promise<ApplyUpdateResponse> {
    const auditEvent = req.events.find((e) => /grant|revoke/.test(e.event))
    const { event, resources } = auditEvent
    const role = getResourceByKind(resources, 'jira.v1.projectrole')
    const user = getResourceByKind(resources, 'user')
    const jiraUserId = geIdFromResources(resources, 'user')
    const method = event === 'access/grant' ? 'POST' : 'DELETE'

    const response = await this.FetchJira({
      method,
      url: `/rest/api/3/${role.id}`,
      data: { user: jiraUserId },
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

function geIdFromResources(resources: Resource[], kind: string): string {
  return resources
    .filter((r) => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase()))
    .map((r) => {
      if (r.labels && r.labels.jiraId) {
        return r.labels.jiraId
      }

      return r.id
    })[0]
}

const getResourceByKind = (resources: Resource[], kind: string): Resource => {
  return resources.filter(
    (r) => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase())
  )[0]
}
