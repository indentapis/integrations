import {
  BaseHttpIntegration,
  BaseHttpIntegrationOpts,
  DecisionIntegration,
  GetDecisionResponse,
  HealthCheckResponse,
  IntegrationInfoResponse,
  PullIntegration,
  PullUpdateRequest,
  StatusCode,
  WriteRequest,
} from '@indent/base-integration'
import { Event, PullUpdateResponse, Resource } from '@indent/types'
import { AxiosRequestConfig, AxiosResponse } from 'axios'

const { version } = require('../package.json')
const INCIDENTIO_API_KEY = process.env.INCIDENTIO_API_KEY || ''
const AUTO_APPROVAL_DURATION = process.env.AUTO_APPROVAL_DURATION || '6'
const AUTO_APPROVAL_INCIDENTIO_ROLES =
  process.env.AUTO_APPROVAL_INCIDENTIO_ROLES || ''

export type IncidentioDecisionIntegrationOpts = BaseHttpIntegrationOpts & {
  autoApprovedRoles?: string[]
  getApprovalEvent?: Event
}

export const INCIDENTIO_ACTOR: Resource = {
  displayName: 'Incident.io Approval Bot',
  email: 'bot@indent.com',
  id: 'incidentio-approval-bot',
  kind: 'indent.v1.Bot',
}

export class IncidentioDecisionIntegration
  extends BaseHttpIntegration
  implements DecisionIntegration, PullIntegration
{
  _name?: string
  _autoApprovedRoles?: string[]
  _getApprovalEvent?: any

  constructor(opts?: IncidentioDecisionIntegrationOpts) {
    super(opts)
    if (opts) {
      this._name = opts.name
      this._autoApprovedRoles = opts.autoApprovedRoles
      this._getApprovalEvent = opts.getApprovalEvent
    }
    if (!this._autoApprovedRoles) {
      if (AUTO_APPROVAL_INCIDENTIO_ROLES !== '') {
        this._autoApprovedRoles = AUTO_APPROVAL_INCIDENTIO_ROLES.split(',')
      }
    }
  }

  HealthCheck(): HealthCheckResponse {
    return { status: { code: 0 } }
  }

  GetInfo(): IntegrationInfoResponse {
    return {
      name: ['indent-integration-incidentio-decision', this._name]
        .filter(Boolean)
        .join('#'),
      capabilities: ['GetDecision', 'PullUpdate'],
      version,
    }
  }

  async FetchIncidentio(
    config: AxiosRequestConfig
  ): Promise<AxiosResponse<any>> {
    return this.Fetch({
      baseURL: 'https://api.incident.io',
      headers: {
        Authorization: `Bearer ${INCIDENTIO_API_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      ...config,
    })
  }

  MatchPull(req: PullUpdateRequest): boolean {
    return (
      req.kinds.filter((k) =>
        k.toLowerCase().includes(INCIDENTIO_ACTOR.kind.toLowerCase())
      ).length > 0
    )
  }

  async PullUpdate(req: PullUpdateRequest): Promise<PullUpdateResponse> {
    return {
      status: { code: StatusCode.OK },
      resources: [INCIDENTIO_ACTOR],
    }
  }

  MatchDecision(_req: WriteRequest): boolean {
    return true
  }

  async GetDecision(req: WriteRequest): Promise<GetDecisionResponse> {
    const res: GetDecisionResponse = {
      status: { code: StatusCode.OK },
      claims: [],
    }

    const response = await this.FetchIncidentio({
      method: 'get',
      url: '/v2/incidents?status_category=live&page_size=100',
    })

    const { incidents = [] } = response.data

    const reqEvent = req.events.find((e) => e.event === 'access/request')
    const actorEmail = reqEvent.actor.email
    const isIncidentResponder =
      incidents.filter(
        (inc: any) =>
          inc.incident_role_assignments.filter(
            (assignment: any) =>
              // Check if requesting actor is an incident assignee
              assignment.assignee?.email === actorEmail &&
              (!this._autoApprovedRoles
                ? // If no auto approved roles are set, allow any role
                  true
                : // Check if the role name (Incident Lead) or shortform (lead) is in the auto approved roles list
                  this._autoApprovedRoles.includes(assignment.role.name) ||
                  this._autoApprovedRoles.includes(assignment.role.shortform))
          ).length > 0
      ).length > 0

    if (isIncidentResponder) {
      const claim = this._getApprovalEvent
        ? this._getApprovalEvent(reqEvent)
        : getDefaultApprovalEvent(reqEvent)
      res.claims.push(claim)
      console.log('found email in on-call list, auto-approving:', claim)
    } else {
      console.log('skipping, email not found in role assignments')
    }

    return res
  }
}

export function getDefaultApprovalEvent(reqEvent: Event): Event {
  const expireTime = new Date()
  const hours = parseFloat(AUTO_APPROVAL_DURATION)

  expireTime.setTime(expireTime.getTime() + hours * 60 * 60 * 1000)

  return {
    actor: INCIDENTIO_ACTOR,
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
    reason: 'Auto-approved based on being on-call',
  }
}
