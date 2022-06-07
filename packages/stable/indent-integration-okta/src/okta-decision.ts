import {
  BaseHttpIntegration,
  BaseHttpIntegrationOpts,
  DecisionIntegration,
  GetDecisionResponse,
  HealthCheckResponse,
  IntegrationInfoResponse,
  WriteRequest,
} from '@indent/base-integration'
import { Event } from '@indent/types'
import { PartialOktaGroup } from '.'
import { callOktaAPI } from './okta-api'

const version = require('../package.json').version

export type OktaDecisionIntegrationOpts = BaseHttpIntegrationOpts & {
  autoApprovedOktaGroups?: string[]
  getApprovalEvent?: Event
}

export class OktaDecisionIntegration
  extends BaseHttpIntegration
  implements DecisionIntegration
{
  _name?: string
  _autoApprovedOktaGroups?: string[]
  _getApprovalEvent?: any

  constructor(opts?: OktaDecisionIntegrationOpts) {
    super(opts)
    if (opts) {
      this._name = opts.name
      this._autoApprovedOktaGroups = opts.autoApprovedOktaGroups
      this._getApprovalEvent = opts.getApprovalEvent
    }
  }

  GetInfo(): IntegrationInfoResponse {
    return {
      version,
      name: 'indent-okta-groups-decision-webhook',
      capabilities: ['GetDecision'],
    }
  }

  HealthCheck(): HealthCheckResponse {
    return { status: { code: 0 } }
  }

  MatchDecision(_req: WriteRequest): boolean {
    return true
  }

  async GetDecision(req: WriteRequest): Promise<GetDecisionResponse> {
    const status = {}
    const claims = []
    const reqEvent = req.events.find((e) => e.event === 'access/request')

    // call okta API
    // get grouplist
    const { response } = await callOktaAPI(this, {
      method: 'get',
      url: `/api/v1/users/${
        reqEvent.actor.labels.oktaId || reqEvent.actor.id
      }/groups`,
    })

    const groups = response.data as PartialOktaGroup[]

    const groupsSet = new Set(groups.map((g) => g.id))

    if (
      reqEvent &&
      this._autoApprovedOktaGroups.some((gId) => groupsSet.has(gId))
    ) {
      const claim = this._getApprovalEvent
        ? this._getApprovalEvent(reqEvent)
        : getDefaultApprovalEvent(reqEvent)
      claims.push(claim)
    }

    return { status, claims }
  }
}

export function getDefaultApprovalEvent(reqEvent: Event): Event {
  let expireTime = new Date()
  let hours = 1

  expireTime.setTime(expireTime.getTime() + 1 * 60 * 60 * 1000)

  return {
    actor: {
      displayName: 'Okta Approval Bot',
      email: 'bot@indent.com',
      id: 'custom-okta-approval-bot',
      kind: 'indent.v1.Bot',
    },
    event: 'access/approve',
    meta: {
      labels: {
        'indent.com/time/duration': `${hours}h0m0s`,
        'indent.com/time/expires': expireTime.toISOString(),
        ...reqEvent.meta.labels,
      },
    },
    resources: [reqEvent.actor, ...reqEvent.resources],
    timestamp: new Date().toISOString(),
    reason: 'Auto-approved based on existing group membership',
  }
}
