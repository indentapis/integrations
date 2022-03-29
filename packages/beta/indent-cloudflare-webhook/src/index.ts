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
} from '@indent/base-webhook'
import {
  ApplyUpdateResponse,
  PullUpdateResponse,
  Resource,
} from '@indent/types'
import { AxiosRequestConfig, AxiosResponse } from 'axios'

const pkg = require('../package.json')
const CLOUDFLARE_TOKEN = process.env.CLOUDFLARE_TOKEN || ''
const CLOUDFLARE_ACCOUNT_EMAIL = process.env.CLOUDFLARE_ACCOUNT_EMAIL || ''
const CLOUDFLARE_ACCOUNT = process.env.CLOUDFLARE_ACCOUNT || ''

export class CloudflareIntegration
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
      name: ['indent-cloudflare-webhook', this._name].filter(Boolean).join('#'),
      capabilities: ['ApplyUpdate', 'PullUpdate'],
      version: pkg.version,
    }
  }

  MatchApply(req: WriteRequest): boolean {
    return (
      req.events.filter((e) =>
        Boolean(
          e.resources?.filter((r) =>
            r.kind?.toLowerCase().includes('cloudflare.v1.role')
          ).length
        )
      ).length > 0
    )
  }

  FetchCloudflare(
    config: AxiosRequestConfig<any>
  ): Promise<AxiosResponse<any, any>> {
    config.baseURL = `https://api.cloudflare.com/client/v4/`
    config.headers = {
      'Content-Type': `application/json`,
      Authorization: `Bearer ${CLOUDFLARE_TOKEN}`,
    }
    return this.Fetch(config)
  }

  MatchPull(req: PullUpdateRequest): boolean {
    return req.kinds.map((k) => k.toLowerCase()).includes('cloudflare.v1.role')
  }

  async PullUpdate(_req: PullUpdateRequest): Promise<PullUpdateResponse> {
    const response = await this.FetchCloudflare({
      url: `/accounts/${CLOUDFLARE_ACCOUNT}/roles`,
    })

    const { data: result } = response
    const kind = 'cloudflare.v1.Role'
    const timestamp = new Date().toISOString()
    const resources = result.map((r: any) => ({
      id: r.id,
      displayName: r.name,
      description: r.description,
      kind,
      labels: {
        timestamp,
        'cloudflare/id': r.id,
        'cloudflare/permissions': r.permissions.toString(),
      },
    })) as Resource[]

    return {
      resources,
    }
  }

  async ApplyUpdate(req: ApplyUpdateRequest): Promise<ApplyUpdateResponse> {
    const auditEvent = req.events.find((e) => /grant|revoke/.test(e.event))
    const { event, resources } = auditEvent
    const user = getResourceByKind(resources, 'user')
    // list cloudflare members
    const cloudflareMembers = await this.FetchCloudflare({
      method: 'GET',
      url: `/accounts/${CLOUDFLARE_ACCOUNT}/members`,
      params: {
        per_page: 50
      }
    }) // add type

    const cloudflareMember = cloudflareMembers.find()

    // match object.user.email to slack/user email with find
    // get object.id and user.id
      // if user not found we need to add user to account based on their email
    // proceed to put or delete role from user

    // const team = getGithubTeamFromResources(resources, 'cloudflare.v1.Role')
    const method = event === 'access/grant' ? 'PUT' : 'DELETE'
    const response = await this.FetchCloudflare()

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

function getResourceByKind(resources: Resource[], kind: string): Resource {
  return resources.filter(
    (r) => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase())
  )[0]
}

const getUserFromResources = (resources: Resource[], kind: string): string => {
  return resources
    .filter((r) => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase()))
    .map((r) => r.id)[0]
}
