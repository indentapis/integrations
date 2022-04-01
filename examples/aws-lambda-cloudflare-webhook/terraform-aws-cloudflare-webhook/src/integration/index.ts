import {
  ApplyUpdateRequest,
  BaseHttpIntegration,
  BaseHttpIntegrationOpts,
  FullIntegration,
  HealthCheckResponse,
  IntegrationInfoResponse,
  PullUpdateRequest,
  StatusCode,
  WriteRequest
} from '@indent/base-webhook'
import {
  ApplyUpdateResponse,
  PullUpdateResponse,
  Resource
} from '@indent/types'
import { AxiosRequestConfig, AxiosResponse } from 'axios'
import { CloudflareMember } from './cloudflare-types'

//const pkg = require('../package.json')
const CLOUDFLARE_TOKEN = process.env.CLOUDFLARE_TOKEN || ''
const CLOUDFLARE_ACCOUNT = process.env.CLOUDFLARE_ACCOUNT || ''
//const CLOUDFLARE_ACCOUNT_EMAIL = process.env.CLOUDFLARE_ACCOUNT_EMAIL || ''

export class CloudflareIntegration
  extends BaseHttpIntegration
  implements FullIntegration
{
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
      version: 'canary',
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

  async FetchCloudflare(
    config: AxiosRequestConfig<any>
  ): Promise<AxiosResponse<any, any>> {
    config.baseURL = `https://api.cloudflare.com/client/v4/`
    config.headers = {
      'Content-Type': `application/json`,
      // 'X-Auth-Key': CLOUDFLARE_TOKEN,
      // 'X-Auth-Email': CLOUDFLARE_ACCOUNT_EMAIL,
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
    }).catch((err) => {
      console.log(err.response.data.errors)
      throw err
    })

    const {
      data: { result },
    } = response
    const kind = 'cloudflare.v1.AccountRole'
    const timestamp = new Date().toISOString()
    const resources = result.map((r: any) => ({
      id: `api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT}/roles/${r.id}`,
      displayName: r.name,
      kind,
      labels: {
        description: r.description,
        timestamp,
        'cloudflare/id': r.id,
        'cloudflare/role': JSON.stringify(r),
      },
    })) as Resource[]

    return {
      status: {},
      resources,
    }
  }

  async ApplyUpdate(req: ApplyUpdateRequest): Promise<ApplyUpdateResponse> {
    const auditEvent = req.events.find((e) => /grant|revoke/.test(e.event))
    const { event, resources } = auditEvent
    const user = getResourceByKind(resources, 'user')
    const cloudflareRole = getResourceByKind(
      resources,
      'cloudflare.v1.accountrole'
    )
    // list cloudflare members
    const cloudflareResponse = await this.FetchCloudflare({
      method: 'GET',
      url: `/accounts/${CLOUDFLARE_ACCOUNT}/members`,
      params: {
        per_page: 50,
      },
    })

    const {
      data: { result },
    } = cloudflareResponse

    // match object.user.email to slack/user email with find
    const cloudflareMember = result.find((r: CloudflareMember) => {
      user.email === r.user.email
    })

    console.log('cloudflare member: ', cloudflareMember)

    const method = event === 'access/grant' ? 'PUT' : 'DELETE'

    if (method) {
      if (cloudflareMember) {
        const cloudflareMemberRoles = cloudflareMember.roles.filter((role) => {
          role.id !== cloudflareRole.id
        })

        console.log('cloudflare roles: ', cloudflareMemberRoles)

        await this.FetchCloudflare({
          method,
          url: `/accounts/${CLOUDFLARE_ACCOUNT}/members/${cloudflareMember.id}`,
          data: {
            id: CLOUDFLARE_ACCOUNT,
            user: cloudflareMember.user,
            roles: [...cloudflareMemberRoles],
          },
        })
          .then((res) => {
            console.log(res)
            return { status: {} }
          })
          .catch((error) => ({
            status: {
              code: StatusCode.UNKNOWN,
              details: { errorData: error.data },
            },
          }))
      } else {
        await this.FetchCloudflare({
          method: 'POST',
          url: `/accounts/${CLOUDFLARE_ACCOUNT}/members`,
          data: {
            email: user.email,
            status: 'accepted',
            roles: [cloudflareRole.id],
          },
        })
          .then((res) => {
            console.log(res)
            return { status: {} }
          })
          .catch((error) => ({
            status: {
              code: StatusCode.UNKNOWN,
              details: { errorData: error.data },
            },
          }))
      }
    }
    return { status: {}}
  }
}

function getResourceByKind(resources: Resource[], kind: string): Resource {
  return resources.filter(
    (r) => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase())
  )[0]
}

// const getResourceLabelFromResources = (
//   resources: Resource[],
//   kind: string,
//   label: string
// ): string => {
//   return resources
//     .filter((r) => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase()))
//     .map((r) => {
//       if (r.labels && r.labels[label]) {
//         return r.labels[label]
//       }
//     })[0]
// }
