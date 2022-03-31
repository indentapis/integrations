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
import { CloudflareMember } from './cloudflare-types'

const pkg = require('../package.json')
const CLOUDFLARE_TOKEN = process.env.CLOUDFLARE_TOKEN || ''
const CLOUDFLARE_ACCOUNT = process.env.CLOUDFLARE_ACCOUNT || ''

export class CloudflareIntegration
  extends BaseHttpIntegration
  implements FullIntegration
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
            r.kind?.toLowerCase().includes('cloudflare.v1.accountrole')
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
    return req.kinds
      .map((k) => k.toLowerCase())
      .includes('cloudflare.v1.accountrole')
  }

  async PullUpdate(_req: PullUpdateRequest): Promise<PullUpdateResponse> {
    const response = await this.FetchCloudflare({
      url: `/accounts/${CLOUDFLARE_ACCOUNT}/roles`,
    })

    const { data: result } = response
    const kind = 'cloudflare.v1.AccountRole'
    const timestamp = new Date().toISOString()
    const resources = result.map((r: any) => ({
      id: `api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT}/roles/${r.id}`,
      displayName: r.name,
      description: r.description,
      kind,
      labels: {
        timestamp,
        'cloudflare/id': r.id,
        'cloudflare/role': JSON.stringify(r),
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
    const cloudflareRole = getResourceLabelFromResources(
      resources,
      'cloudflare.v1.AccountRole',
      'cloudflare/role'
    )
    // list cloudflare members
    const cloudflareResponse = await this.FetchCloudflare({
      method: 'GET',
      url: `/accounts/${CLOUDFLARE_ACCOUNT}/members`,
      params: {
        per_page: 50,
      },
    })

    const { data: results } = cloudflareResponse

    // match object.user.email to slack/user email with find
    const cloudflareMember = results.result.find((r: CloudflareMember) => {
      user.email === r.user.email
    })

    const cloudflareMemberRoles = cloudflareMember.roles.filter((role) => {
      role.id !== cloudflareRole['cloudflare/id']
    })

    if (!cloudflareMember) {
      await this.FetchCloudflare({
        method: 'POST',
        url: `/accounts/${CLOUDFLARE_ACCOUNT}/members`,
        data: {
          email: user.email,
        },
      })
    }

    if (cloudflareMember) {
      const method = event === 'access/grant' ? 'PUT' : 'DELETE'
      const response = await this.FetchCloudflare({
        method,
        url: `/accounts/${CLOUDFLARE_ACCOUNT}/members/${cloudflareMember.id}`,
        data: {
          id: CLOUDFLARE_ACCOUNT,
          user: cloudflareMember.user,
          roles: [...cloudflareMemberRoles],
        },
      })

      if (response.status > 204) {
        return {
          status: {
            code: StatusCode.UNKNOWN,
            details: { errorData: response.data },
          },
        }
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

const getResourceLabelFromResources = (
  resources: Resource[],
  kind: string,
  label: string
): string => {
  return resources
    .filter((r) => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase()))
    .map((r) => {
      if (r.labels && r.labels[label]) {
        return r.labels[label]
      }
    })[0]
}
