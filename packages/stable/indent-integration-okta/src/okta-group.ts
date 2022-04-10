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
import { callOktaAPI } from './okta-api'

const version = require('../package.json').version
const OKTA_DOMAIN = process.env.OKTA_DOMAIN || ''

export class OktaGroupIntegration
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

  GetInfo(): IntegrationInfoResponse {
    return {
      version,
      name: 'indent-okta-groups-webhook',
      capabilities: ['ApplyUpdate', 'PullUpdate'],
    }
  }

  HealthCheck(): HealthCheckResponse {
    return { status: { code: 0 } }
  }

  MatchApply(req: WriteRequest): boolean {
    return (
      req.events.filter((e) =>
        Boolean(
          e.resources?.filter((r) =>
            r.kind?.toLowerCase().includes('okta.v1.group')
          ).length
        )
      ).length > 0
    )
  }

  async ApplyUpdate(req: ApplyUpdateRequest): Promise<ApplyUpdateResponse> {
    const auditEvent = req.events.find((e) => /grant|revoke/.test(e.event))
    const { event, resources } = auditEvent
    const user = getOktaIdFromResources(resources, 'user')
    const group =
      getOktaIdFromResources(resources, 'app') ||
      getOktaIdFromResources(resources, 'group')
    const method =
      event === 'access/grant'
        ? // If it's a grant event, add the user
          'PUT'
        : // Otherwise it's a revoke event, remove the user
          'DELETE'
    const { status } = await callOktaAPI(this, {
      method,
      url: `/api/v1/groups/${group}/users/${user}`,
    })

    return { status }
  }

  MatchPull(req: PullUpdateRequest): boolean {
    return req.kinds.map((k) => k.toLowerCase()).includes('okta.v1.group')
  }

  async PullUpdate(req: PullUpdateRequest): Promise<PullUpdateResponse> {
    if (!this.MatchPull(req)) {
      return {
        status: {
          code: StatusCode.INVALID_ARGUMENT,
          details: [
            {
              expectedKindLower: 'okta.v1.group',
              actualKinds: req.kinds,
            },
          ],
        },
      }
    }

    const { status, response } = await callOktaAPI(this, {
      method: 'GET',
      url: '/api/v1/groups',
    })

    const timestamp = new Date().toISOString()
    const resources = response.data.map((group) =>
      pick({
        id: [OKTA_DOMAIN, group.id].join('/api/v1/groups/'),
        kind: 'okta.v1.Group',
        email: group.profile?.email,
        displayName: group.profile?.name,
        labels: {
          oktaId: group.id,
          description: group.profile?.description || '',
          oktaGroupType: group.type,
          timestamp,
        },
      })
    )

    return { status, resources }
  }
}

const getOktaIdFromResources = (
  resources: Resource[],
  kind: string
): string => {
  return resources
    .filter((r) => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase()))
    .map((r) => {
      if (r.labels && r.labels.oktaId) {
        return r.labels.oktaId
      }

      return r.id
    })[0]
}

const pick = (obj: any) =>
  Object.keys(obj).reduce(
    (acc, key) => ({
      ...acc,
      ...(typeof obj[key] !== 'undefined' ? { [key]: obj[key] } : {}),
    }),
    {}
  )
