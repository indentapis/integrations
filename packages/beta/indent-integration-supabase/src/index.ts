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

const pkg = require('../package.json')
const SUPABASE_TOKEN = process.env.SUPABASE_TOKEN || ''
const SUPABASE_ORG_ID = process.env.SUPABASE_ORG_ID || ''

export class SupabaseIntegration
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
      name: ['indent-supabase-webhook', this._name].filter(Boolean).join('#'),
      capabilities: ['ApplyUpdate', 'PullUpdate'],
      version: pkg.version,
    }
  }

  MatchApply(req: WriteRequest): boolean {
    return (
      req.events.filter((e) =>
        Boolean(
          e.resources?.filter((r) =>
            r.kind?.toLowerCase().includes('supabase.v1.role')
          ).length
        )
      ).length > 0
    )
  }

  async FetchSupabase(
    config: AxiosRequestConfig<any>
  ): Promise<AxiosResponse<any, any>> {
    config.baseURL = `https://api.supabase.io`
    config.headers = {
      'Content-Type': `application/json`,
      Authorization: `Bearer ${SUPABASE_TOKEN}`,
    }
    return this.Fetch(config)
  }

  MatchPull(req: PullUpdateRequest): boolean {
    return req.kinds.map((k) => k.toLowerCase()).includes('supabase.v1.role')
  }

  async PullUpdate(_req: PullUpdateRequest): Promise<PullUpdateResponse> {
    const response = await this.FetchSupabase({
      url: `/v0/organizations/${SUPABASE_ORG_ID}/roles`,
    })

    const { data: result } = response
    const kind = 'supabase.v1.Role'
    const resources = result.map((r) => ({
      id: `${SUPABASE_ORG_ID}-${r.id}`,
      displayName: r.name,
      kind,
      labels: {
        org_id: SUPABASE_ORG_ID,
        role_id: `${r.id}`,
      },
    })) as Resource[]
    return {
      resources,
    }
  }

  async ApplyUpdate(req: ApplyUpdateRequest): Promise<ApplyUpdateResponse> {
    const auditEvent = req.events.find((e) => /grant|revoke/.test(e.event))
    const { event, resources } = auditEvent
    const actor = getResourceByKind(resources, 'user')
    const resource = getResourceByKind(resources, 'supabase.v1.role')

    let res: ApplyUpdateResponse = {
      status: { code: StatusCode.UNKNOWN, message: 'unknown error' },
    }

    try {
      // Fetch current organization members
      const { data: members } = await this.FetchSupabase({
        url: `/v0/organizations/${SUPABASE_ORG_ID}/members`,
      })

      const existingMember = members.find(
        (m) => m.primary_email === actor.email
      )

      if (event === 'access/grant') {
        if (
          existingMember &&
          existingMember.role_ids.includes(
            parseInt(resource.labels.role_id, 10)
          )
        ) {
          res.status.code = StatusCode.OK
          delete res.status.message
        } else if (existingMember) {
          // Update existing member with new role
          await this.FetchSupabase({
            method: 'PATCH',
            url: `/v0/organizations/${SUPABASE_ORG_ID}/members/${existingMember.gotrue_id}`,
            data: { role_id: parseInt(resource.labels.role_id, 10) },
          })
          res.status.code = StatusCode.OK
          delete res.status.message
        } else {
          // Invite new member
          await this.FetchSupabase({
            method: 'POST',
            url: `/v0/organizations/${SUPABASE_ORG_ID}/members/invite`,
            data: {
              invited_email: actor.email,
              role_id: parseInt(resource.labels.role_id, 10),
            },
          })
          res.status.code = StatusCode.OK
          delete res.status.message
        }
      } else if (event === 'access/revoke') {
        if (!existingMember) {
          res.status.code = StatusCode.OK
          delete res.status.message
        } else {
          // Remove role from existing member or remove the member if needed
          await this.FetchSupabase({
            method: 'DELETE',
            url: `/v0/organizations/${SUPABASE_ORG_ID}/members/invite?invited_id=${existingMember.gotrue_id}`,
          })
          res.status.code = StatusCode.OK
          delete res.status.message
        }
      }
    } catch (err) {
      if (err.response) {
        res.status.message = JSON.stringify(err.response.data)
      } else {
        res.status.message = err.toString()
      }
    }

    return res
  }
}

function getResourceByKind(resources: Resource[], kind: string): Resource {
  return resources.filter(
    (r) => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase())
  )[0]
}
