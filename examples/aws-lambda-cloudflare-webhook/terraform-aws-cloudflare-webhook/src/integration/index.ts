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
import { CloudflareMember, CloudflareRole } from './cloudflare-types'

//const pkg = require('../package.json')
const CLOUDFLARE_TOKEN = process.env.CLOUDFLARE_TOKEN || ''
const CLOUDFLARE_ACCOUNT = process.env.CLOUDFLARE_ACCOUNT || ''
// const CLOUDFLARE_ACCOUNT_EMAIL = process.env.CLOUDFLARE_ACCOUNT_EMAIL || ''

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
    const grantee = getResourceByKind(resources, 'user')
    const granted = getResourceByKind(resources, 'cloudflare.v1.accountrole')

    let res: ApplyUpdateResponse = { status: { code: StatusCode.UNKNOWN } }

    try {
      // list cloudflare members
      const {
        data: { result: memberList },
      } = await this.FetchCloudflare({
        method: 'GET',
        url: `/accounts/${CLOUDFLARE_ACCOUNT}/members`,
        params: { per_page: 50 },
      })

      // find existing cloudflare member
      const existingMember: CloudflareMember = memberList.find(
        (r: CloudflareMember) => grantee.email === r.user.email
      )

      // check if member already has role
      if (existingMember) {
        if (
          existingMember.roles?.find(
            (r: CloudflareRole) => r.id === getCloudflareId(granted)
          )
        ) {
          if (event === 'access/grant') {
            // if grant respond with success
            res.status.code = StatusCode.OK
            return res
          } else {
            // if revoke, remove role from member
            existingMember.roles?.filter(
              (r: CloudflareRole) => r.id !== getCloudflareId(granted)
            )
            // TODO: add HTTP call to update member without role
            const { data: removeMemberData } = await this.FetchCloudflare({
              method: 'PUT',
              url: `/accounts/${CLOUDFLARE_ACCOUNT}/members/${existingMember.id}`,
              data: {
                ...existingMember,
              },
            })

            if (removeMemberData.success) {
              res.status.code = StatusCode.OK
            } else {
              res.status.code = StatusCode.UNIMPLEMENTED
              console.error('failed to remove member')
              console.error(removeMemberData)
            }
            return res
          }
        } else {
          existingMember.roles?.push(
            JSON.parse(granted.labels['cloudflare/role'])
          )
          console.log('existing member roles')
          console.log(existingMember.roles)
          // TODO: add HTTP call to update member without role
          const { data: updateMemberData } = await this.FetchCloudflare({
            method: 'PUT',
            url: `/accounts/${CLOUDFLARE_ACCOUNT}/members/${existingMember.id}`,
            data: {
              ...existingMember,
            },
          })

          if (updateMemberData.success) {
            res.status.code = StatusCode.OK
          } else {
            res.status.code = StatusCode.UNIMPLEMENTED
            console.error("failed to update member's roles")
            console.error(updateMemberData)
          }
          return res
        }
      } else if (event === 'access/grant') {
        // if member does not exist, create member with role
        const { data: createMemberData } = await this.FetchCloudflare({
          method: 'POST',
          url: `/accounts/${CLOUDFLARE_ACCOUNT}/members`,
          data: {
            email: grantee.email,
            status: 'accepted',
            roles: [getCloudflareId(granted)],
          },
        })

        if (createMemberData.success) {
          res.status.code = StatusCode.OK
        } else {
          console.error('failed to create member')
          console.error(createMemberData)
        }
      } else {
        // if there's no existing member and access/revoke, respond with success
        res.status.code = StatusCode.OK
      }
    } catch (err) {
      console.error(err)
      if (err.response) {
        res.status.message = JSON.stringify(err.response.data)
      } else {
        res.status.message = err.toString()
      }
    }
    return res
  }
}

function getCloudflareId(resource: Resource): string {
  if (resource.labels?.['cloudflare/id']) {
    return resource.labels['cloudflare/id']
  } else if (resource.id.includes('api.cloudflare.com')) {
    return resource.id.split('/').pop()
  }
  return resource.id
}

function getResourceByKind(resources: Resource[], kind: string): Resource {
  return resources.filter(
    (r) => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase())
  )[0]
}
