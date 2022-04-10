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
import {
  addUserToGroup,
  loadFromGoogleGroups,
  removeUserFromGroup,
} from './google-api'

const GOOGLE_CUSTOMER_ID = process.env.GOOGLE_CUSTOMER_ID
const GCP_SVC_ACCT_EMAIL = process.env.GCP_SVC_ACCT_EMAIL

const version = require('../package.json').version

export type GoogleGroupsIntegrationOpts = BaseHttpIntegrationOpts & {
  autoApprovedGoogleGroups?: string[]
}
export class GoogleGroupsIntegration
  extends BaseHttpIntegration
  implements FullIntegration
{
  _name?: string
  _autoApprovedGoogleGroups?: string[]

  constructor(opts?: GoogleGroupsIntegrationOpts) {
    super(opts)

    if (opts) {
      if (opts.autoApprovedGoogleGroups) {
        this._autoApprovedGoogleGroups = opts.autoApprovedGoogleGroups
      }
    }
  }

  GetInfo(): IntegrationInfoResponse {
    return {
      name: ['indent-google-groups-webhook', this._name]
        .filter(Boolean)
        .join('#'),
      capabilities: ['ApplyUpdate', 'PullUpdate', 'GetDecision'],
      version,
    }
  }

  HealthCheck(): HealthCheckResponse {
    return { status: { code: 0 } }
  }

  FetchGoogleGroups(
    config: AxiosRequestConfig<any>
  ): Promise<AxiosResponse<any, any>> {
    return this.Fetch(config)
  }

  MatchApply(req: WriteRequest): boolean {
    return (
      req.events.filter((e) =>
        Boolean(
          e.resources?.filter((r) =>
            r.kind?.toLowerCase().includes('google.v1.group')
          ).length
        )
      ).length > 0
    )
  }

  MatchPull(req: PullUpdateRequest): boolean {
    return req.kinds.map((k) => k.toLowerCase()).includes('google.v1.group')
  }

  async PullUpdate(req: PullUpdateRequest): Promise<PullUpdateResponse> {
    if (!this.MatchPull(req)) {
      return {
        status: {
          code: StatusCode.INVALID_ARGUMENT,
          details: {
            expectedKindLower: 'google.v1.group',
            actualKinds: req.kinds,
          },
        },
      }
    }

    const groups = await loadFromGoogleGroups()
    const timestamp = new Date().toISOString()
    const kind = 'google.v1.Group'
    const resources = groups.map((g) => ({
      id: g.name.split('/')[1],
      kind,
      displayName: g.displayName,
      labels: {
        ...(g.labels || {}),
        timestamp,
      },
    })) as Resource[]

    return { status: { code: 0 }, resources }
  }

  async ApplyUpdate(req: ApplyUpdateRequest): Promise<ApplyUpdateResponse> {
    const auditEvent = req.events.find((e) => /grant|revoke/.test(e.event))
    const { event, resources } = auditEvent
    const group = getIdFromResources(resources, 'google.v1.group')
    const user = getEmailFromResources(resources, 'user')

    try {
      if (event === 'access/grant') {
        await addUserToGroup({ user, group })
      } else {
        await removeUserFromGroup({ user, group })
      }

      return { status: { code: 0 } }
    } catch (err) {
      return { status: { code: 2, message: err.message, details: err.stack } }
    }
  }
}

function getIdFromResources(resources: Resource[], kind: string) {
  return resources
    .filter((r) => r.kind?.toLowerCase().includes(kind.toLowerCase()))
    .map((r) => r.id)[0]
}

function getEmailFromResources(resources: Resource[], kind: string) {
  return resources
    .filter((r) => r.kind?.toLowerCase().includes(kind.toLowerCase()))
    .map((r) => r.email || r.id)[0]
}
