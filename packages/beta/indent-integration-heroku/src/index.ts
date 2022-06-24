import {
  ApplyUpdateRequest,
  BaseHttpIntegration,
  BaseHttpIntegrationOpts,
  FullIntegration,
  HealthCheckResponse,
  IntegrationInfoResponse,
  PullUpdateRequest,
  StatusCode,
  WriteRequest,
} from '@indent/base-integration'
import {
  ApplyUpdateResponse,
  PullUpdateResponse,
  Resource,
} from '@indent/types'
import { AxiosRequestConfig, AxiosResponse } from 'axios'

export interface HerokuTeam {
  created_at: Date
  credit_card_collections: boolean
  default: boolean
  id: string
  name: string
  provisioned_licenses: boolean
  type: 'enterprise' | 'team'
  updated_at: Date
  role?: 'admin' | 'collaborator' | 'member' | 'owner' | null
  membership_limit?: number
  identity_provider?: {
    id: string
    name: string
    owner: {
      id: string
      name: string
      type: 'team' | 'enterprise-account '
    }
  }
  enterprise_account?: {
    id: string
    name: string
  }
}

const { version } = require('../package.json')
const HEROKU_KEY = process.env.HEROKU_KEY

export class HerokuTeamsIntegration
  extends BaseHttpIntegration
  implements FullIntegration
{
  _name?: string

  constructor(opts?: BaseHttpIntegrationOpts) {
    super(opts)
  }

  GetInfo(): IntegrationInfoResponse {
    return {
      version,
      name: 'indent-integration-heroku',
      capabilities: ['ApplyUpdate', 'PullUpdate'],
    }
  }

  HealthCheck(): HealthCheckResponse {
    return {
      status: {
        code: StatusCode.OK,
      },
    }
  }

  MatchApply(req: WriteRequest): boolean {
    return (
      req.events.filter((e) =>
        Boolean(
          e.resources?.filter((r) =>
            r.kind?.toLowerCase().includes('heroku.v1.team')
          ).length
        )
      ).length > 0
    )
  }

  FetchHeroku(
    config: AxiosRequestConfig<any>
  ): Promise<AxiosResponse<any, any>> {
    config.baseURL = `https://api.heroku.com`
    config.headers = {
      'Content-Type': 'application/vnd.heroku+json; version=3',
      Accept: 'application/json',
      Authorization: `Bearer ${HEROKU_KEY}`,
    }
    return this.Fetch(config)
  }

  async PullUpdate(_req: PullUpdateRequest): Promise<PullUpdateResponse> {
    const response = (await this.FetchHeroku({
      method: 'get',
      url: `/teams`,
    }).then((r) => r.data)) as HerokuTeam[]

    const resources = response.map((team: HerokuTeam) => {
      const { id, name, type, role, identity_provider, enterprise_account } =
        team

      const kind = 'heroku.v1.Team'
      const timestamp = new Date().toISOString()

      return {
        id,
        kind,
        displayName: name,
        labels: {
          'heroku/role': role,
          'heroku/id': id,
          'heroku/name': name,
          'heroku/type': type,
          'heroku/identity_provider:id': identity_provider?.id,
          'heroku/identity_provider:name': identity_provider?.name,
          'heroku/enterprise_account:id': enterprise_account?.name,
          'heroku/enterprise_account:name': enterprise_account?.name,
          timestamp,
        },
      }
    }) as Resource[]
    return { resources }
  }

  async ApplyUpdate(req: ApplyUpdateRequest): Promise<ApplyUpdateResponse> {
    const auditEvent = req.events.find((e) => /grant|revoke/.test(e.event))
    const { event, resources } = auditEvent
    const { email } = getResourceByKind(resources, 'user')
    const { id } = getResourceByKind(resources, 'heroku.v1.team')

    let updateResponse: AxiosResponse<any, any>
    if (event === 'access/grant') {
      updateResponse = await this.FetchHeroku({
        method: 'PUT',
        url: `/teams/${id}/members`,
        data: {
          email,
          role: 'admin',
        },
      })
    } else {
      updateResponse = await this.FetchHeroku({
        method: 'DELETE',
        url: `/teams/${id}/members/${email}`,
      })
    }

    if (updateResponse.status > 201) {
      return {
        status: {
          code: StatusCode.UNKNOWN,
          details: { errorData: updateResponse.data },
        },
      }
    }

    return { status: {} }
  }
}

const getResourceByKind = (resources: Resource[], kind: string): Resource =>
  resources.filter(
    (r) => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase())
  )[0]
