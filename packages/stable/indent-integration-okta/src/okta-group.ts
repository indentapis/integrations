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

export class OktaGroupIntegration
  extends BaseHttpIntegration
  implements FullIntegration
{
  _name?: string

  secretNames: string[] = [
    'OKTA_DOMAIN',
    'OKTA_TOKEN',
    'OKTA_SLACK_APP_ID',
    'OKTA_CLIENT_ID',
    'OKTA_PRIVATE_KEY',
  ]

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
    const group =
      getOktaIdFromResources(resources, 'app') ||
      getOktaIdFromResources(resources, 'group')
    let user = getOktaIdFromResources(resources, 'user')

    if (!user) {
      // Get the Okta User ID from the API based on email
      const email = getUserEmailFromResources(resources, 'user')
      const { response } = await callOktaAPI(this, {
        method: 'GET',
        url: `/api/v1/users?search=(profile.email eq "${email}")`,
        scope: 'okta.users.manage',
      })
      user = response.data?.[0]?.id
      if (!user) {
        return {
          status: {
            code: StatusCode.NOT_FOUND,
            message: `failed to find Okta user with email ${email}`,
          },
        }
      }
    }

    const method =
      event === 'access/grant'
        ? // If it's a grant event, add the user
          'PUT'
        : // Otherwise it's a revoke event, remove the user
          'DELETE'
    const { status } = await callOktaAPI(this, {
      method,
      scope: 'okta.groups.manage',
      url: `/api/v1/groups/${group}/users/${user}`,
    })

    return { status }
  }

  MatchPull(req: PullUpdateRequest): boolean {
    return req.kinds.map((k) => k.toLowerCase()).includes('okta.v1.group')
  }

  async PullUpdate(req: PullUpdateRequest): Promise<PullUpdateResponse> {
    const OKTA_DOMAIN = process.env.OKTA_DOMAIN || ''

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
      scope: 'okta.groups.manage',
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

    console.log('@indent/integration-okta: pulled groups')
    console.log({
      resources,
    })

    return { status, resources }
  }
}

const getUserEmailFromResources = (
  resources: Resource[],
  kind: string
): string => {
  return resources
    .filter((r) => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase()))
    .map((r) => r.email)[0]
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
      if (kind !== 'user' || r.kind.toLowerCase() === 'okta.v1.user') {
        return r.id
      }
      return ''
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
