import {
  ApplyUpdateRequest,
  BaseHttpIntegration,
  BaseHttpIntegrationOpts,
  FullIntegration,
  HealthCheckResponse,
  IntegrationInfoResponse,
  PullUpdateRequest,
  StatusCode,
} from '@indent/base-webhook'
import {
  ApplyUpdateResponse,
  PullUpdateResponse,
  Resource,
} from '@indent/types'
import { AxiosRequestConfig, AxiosResponse } from 'axios'

const pkg = require('../package.json')

export const GITHUB_TOKEN = process.env.GITHUB_TOKEN
export const GITHUB_ORG = process.env.GITHUB_ORG

export class GithubTeamsIntegration
  extends BaseHttpIntegration
  implements FullIntegration
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
      name: ['indent-github-teams-webhook', this._name]
        .filter(Boolean)
        .join('#'),
      capabilities: ['ApplyUpdate', 'PullUpdate'],
      version: pkg.version,
    }
  }

  FetchGithub(
    config: AxiosRequestConfig<any>
  ): Promise<AxiosResponse<any, any>> {
    config.baseURL = `https://api.github.com/orgs/${GITHUB_ORG}`
    config.headers = {
      Accept: `application/vnd.github.v3+json`,
      Authorization: `token ${GITHUB_TOKEN}`,
    }
    return this.Fetch(config)
  }

  async PullUpdate(_req: PullUpdateRequest): Promise<PullUpdateResponse> {
    const response = await this.FetchGithub({
      url: '/teams',
      params: {
        page: 1,
        per_page: 100,
      },
    })

    const { data: results } = response
    const kind = 'github.v1.Team'
    const timestamp = new Date().toISOString()
    const resources = results.map((r: GitHubTeam) => ({
      id: r.id.toString(),
      kind,
      displayName: r.name,
      labels: {
        'github/org': GITHUB_ORG,
        'github/id': r.id.toString(),
        'github/slug': r.slug,
        'github/description': r.description,
        'github/privacy': r.privacy,
        'github/permission': r.permission,
        'github/parent': r.parent ? r.parent : '',
        timestamp,
      },
    })) as Resource[]

    return {
      resources,
    }
  }

  async ApplyUpdate(req: ApplyUpdateRequest): Promise<ApplyUpdateResponse> {
    const auditEvent = req.events.find((e) => /grant|revoke/.test(e.event))
    const { event, resources } = auditEvent
    const user = getGithubIdFromResources(resources, 'user')
    const team = getGithubTeamFromResources(resources, 'github.v1.team')
    const method = event === 'access/grant' ? 'PUT' : 'DELETE'
    const response = await this.FetchGithub({
      method,
      url: `/teams/${team}/memberships/${user}`,
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

const getGithubIdFromResources = (
  resources: Resource[],
  kind: string
): string => {
  return resources
    .filter((r) => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase()))
    .map((r) => r.labels['github/id'] || r.id)[0]
}

const getGithubTeamFromResources = (resources: Resource[], kind: string) => {
  return resources
    .filter((r) => r.kind?.toLowerCase().includes(kind.toLowerCase()))
    .map((r) => r.labels['github/slug'])[0]
}

type GitHubTeam = {
  name: string
  id: number
  node_id?: string
  slug?: string
  description?: string
  privacy?: 'secret' | 'closed'
  url?: string
  html_url?: string
  members_url?: string
  repositories_url?: string
  permission?: 'pull' | 'push' | 'admin'
  parent?: string | null
}
