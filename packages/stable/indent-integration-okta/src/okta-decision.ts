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

const AUTO_APPROVAL_DURATION = process.env.AUTO_APPROVAL_DURATION || '6' // hours
const AUTO_APPROVAL_OKTA_GROUPS = process.env.AUTO_APPROVAL_OKTA_GROUPS || ''
const AUTO_DENIAL_OKTA_GROUPS = process.env.AUTO_DENIAL_OKTA_GROUPS || ''
const AUTO_DENIAL_EXCLUDE_OKTA_GROUPS =
  process.env.AUTO_DENIAL_EXCLUDE_OKTA_GROUPS || ''

export type OktaDecisionIntegrationOpts = BaseHttpIntegrationOpts & {
  autoDenialOktaGroups?: string[]
  autoApprovalOktaGroups?: string[]
  autoDenialExcludeOktaGroups?: string[]
  getApprovalEvent?: (reqEvent: Event) => Event
  getDenialEvent?: (reqEvent: Event) => Event
}

export class OktaDecisionIntegration
  extends BaseHttpIntegration
  implements DecisionIntegration
{
  _name?: string
  _autoDenialOktaGroups?: string[]
  _autoApprovalOktaGroups?: string[]
  _autoDenialExcludeOktaGroups?: string[]
  _getDenialEvent?: (reqEvent: Event) => Event
  _getApprovalEvent?: (reqEvent: Event) => Event

  constructor(opts?: OktaDecisionIntegrationOpts) {
    super(opts)
    if (opts) {
      this._name = opts.name
      this._autoDenialOktaGroups = opts.autoDenialOktaGroups
      this._autoDenialExcludeOktaGroups = opts.autoDenialExcludeOktaGroups
      this._autoApprovalOktaGroups = opts.autoApprovalOktaGroups
      this._getApprovalEvent = opts.getApprovalEvent
      this._getDenialEvent = opts.getDenialEvent
    }
    if (!this._autoApprovalOktaGroups) {
      if (AUTO_APPROVAL_OKTA_GROUPS !== '') {
        this._autoApprovalOktaGroups = AUTO_APPROVAL_OKTA_GROUPS.split(',')
      }
    }
    if (!this._autoDenialOktaGroups) {
      if (AUTO_DENIAL_OKTA_GROUPS !== '') {
        this._autoDenialOktaGroups = AUTO_DENIAL_OKTA_GROUPS.split(',')
      }
    }
    if (!this._autoDenialExcludeOktaGroups) {
      if (AUTO_DENIAL_EXCLUDE_OKTA_GROUPS !== '') {
        this._autoDenialExcludeOktaGroups =
          AUTO_DENIAL_EXCLUDE_OKTA_GROUPS.split(',')
      }
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
      scope: 'okta.users.manage',
      url: `/api/v1/users/${
        reqEvent.actor.labels.oktaId || reqEvent.actor.id
      }/groups`,
    })

    const groups = response.data as PartialOktaGroup[]
    const groupsSet = new Set(groups.map((g) => g.id))

    // Check for auto denial
    if (
      reqEvent &&
      (this._autoDenialExcludeOktaGroups ||
        (this._autoDenialOktaGroups &&
          this._autoDenialOktaGroups.some((gid) => groupsSet.has(gid))))
    ) {
      if (
        !this._autoDenialExcludeOktaGroups ||
        !this._autoDenialExcludeOktaGroups.some((gid) => groupsSet.has(gid))
      ) {
        const claim = this._getDenialEvent
          ? this._getDenialEvent(reqEvent)
          : getDefaultDenialEvent(reqEvent)
        claims.push(claim)
      }
    }

    // Check for auto approval
    if (
      reqEvent &&
      this._autoApprovalOktaGroups &&
      this._autoApprovalOktaGroups.some((gid) => groupsSet.has(gid))
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
  const hours = parseFloat(AUTO_APPROVAL_DURATION)

  expireTime.setTime(expireTime.getTime() + hours * 60 * 60 * 1000)

  return {
    actor: {
      displayName: 'Okta Approval Bot',
      email: 'bot@indent.com',
      id: 'okta-approval-bot',
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

export function getDefaultDenialEvent(reqEvent: Event): Event {
  return {
    actor: {
      displayName: 'Okta Approval Bot',
      email: 'bot@indent.com',
      id: 'okta-approval-bot',
      kind: 'indent.v1.Bot',
    },
    event: 'access/deny',
    meta: {
      labels: {
        ...reqEvent.meta.labels,
      },
    },
    resources: [reqEvent.actor, ...reqEvent.resources],
    timestamp: new Date().toISOString(),
    reason: 'Auto-denied based on missing group membership',
  }
}
