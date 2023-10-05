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
import { CloudflareMember, CloudflareRole } from './cloudflare-types'

const pkg = require('../package.json')
const CLOUDFLARE_TOKEN = process.env.CLOUDFLARE_TOKEN || ''
const CLOUDFLARE_ACCOUNT = process.env.CLOUDFLARE_ACCOUNT || ''

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

  async FetchCloudflare(
    config: AxiosRequestConfig<any>
  ): Promise<AxiosResponse<any, any>> {
    config.baseURL = `https://api.cloudflare.com`
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
      url: `/client/v4/accounts/${CLOUDFLARE_ACCOUNT}/roles`,
    })

    const {
      data: { result },
    } = response
    console.log(`debug result ${result}`)
    const kind = 'cloudflare.v1.AccountRole'
    const timestamp = new Date().toISOString()
    const resources = result.map((r) => ({
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
    console.log(`debug resources: resources`)
    return {
      resources,
    }
  }

  async ApplyUpdate(req: ApplyUpdateRequest): Promise<ApplyUpdateResponse> {
    const auditEvent = req.events.find((e) => /grant|revoke/.test(e.event))
    const { event, resources } = auditEvent
    const grantee = getResourceByKind(resources, 'user')
    const granted = getResourceByKind(resources, 'cloudflare.v1.accountrole')

    let res: ApplyUpdateResponse = { status: { code: StatusCode.UNKNOWN } }
    console.log('start apply')
    try {
      // list cloudflare members
      const pageSize = 50
      const {
        data: { result: memberList },
      } = await this.FetchCloudflare({
        method: 'GET',
        url: `/client/v4/accounts/${CLOUDFLARE_ACCOUNT}/members?per_page=${pageSize}`,
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
            // otherwise revoke the role
            const updatedMember = { ...existingMember }
            updatedMember.roles = existingMember.roles?.filter(
              (r: CloudflareRole) => r.id !== getCloudflareId(granted)
            )

            if (existingMember.roles?.length === 1) {
              if (memberList.length > 1) {
                // if not the last member, remove the member
                const { data: removeMemberData } = await this.FetchCloudflare({
                  method: 'DELETE',
                  url: `/client/v4/accounts/${CLOUDFLARE_ACCOUNT}/members/${existingMember.id}`,
                })

                if (removeMemberData.success) {
                  res.status.code = StatusCode.OK
                } else {
                  res.status.code = StatusCode.UNKNOWN
                  console.error('failed to delete member')
                  console.error(removeMemberData)
                }
              } else {
                res.status.code = StatusCode.INVALID_ARGUMENT
                console.log(
                  'You cannot remove the last user and role from the account'
                )
              }
            } else {
              const { data: removeMemberRoleData } = await this.FetchCloudflare(
                {
                  method: 'PUT',
                  url: `/client/v4/accounts/${CLOUDFLARE_ACCOUNT}/members/${existingMember.id}`,
                  data: {
                    roles: updatedMember.roles.map((r: CloudflareRole) => ({
                      id: r.id,
                    })),
                  },
                }
              )

              if (removeMemberRoleData.success) {
                res.status.code = StatusCode.OK
              } else {
                res.status.code = StatusCode.UNIMPLEMENTED
                console.error('failed to remove role from member')
                console.error(removeMemberRoleData)
              }
            }

            return res
          }
        } else {
          // if member exists but doesn't have role
          const updatedMember = { roles: existingMember.roles }
          updatedMember.roles?.push({ id: getCloudflareId(granted) })

          const { data: updateMemberData } = await this.FetchCloudflare({
            method: 'PUT',
            url: `/client/v4/accounts/${CLOUDFLARE_ACCOUNT}/members/${existingMember.id}`,
            data: updatedMember,
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
        console.log('creating new member')
        const { data: createMemberData } = await this.FetchCloudflare({
          method: 'POST',
          url: `/client/v4/accounts/${CLOUDFLARE_ACCOUNT}/members`,
          data: {
            email: grantee.email,
            roles: [getCloudflareId(granted)],
          },
        })
        if (createMemberData.success) {
          console.log('new member created successfully')
          res.status.code = StatusCode.OK
        } else {
          console.error('failed to create member')
          console.error(createMemberData)
          res.status.code = StatusCode.UNKNOWN
        }
      } else {
        // if there's no existing member and access/revoke, respond with success
        console.log('tried removing role from member that does not exist')
        res.status.code = StatusCode.OK
      }
    } catch (err) {
      if (err.response) {
        res.status.message = JSON.stringify(err.response.data)
        console.log(err.response.data)
      } else {
        console.error(err)
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
