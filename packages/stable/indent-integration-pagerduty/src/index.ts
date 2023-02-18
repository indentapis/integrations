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
const PAGERDUTY_KEY = process.env.PAGERDUTY_KEY || ''
const AUTO_APPROVAL_DURATION = process.env.AUTO_APPROVAL_DURATION || '6' // hours
const AUTO_APPROVAL_WINDOW_BEFORE =
  process.env.AUTO_APPROVAL_WINDOW_BEFORE || '1' // minutes
const AUTO_APPROVAL_WINDOW_AFTER = process.env.AUTO_APPROVAL_WINDOW_AFTER || '5' // minutes
const AUTO_APPROVAL_PAGERDUTY_SCHEDULES =
  process.env.AUTO_APPROVAL_PAGERDUTY_SCHEDULES || ''

export type PagerdutyDecisionIntegrationOpts = BaseHttpIntegrationOpts & {
  autoApprovedSchedules?: string[]
  getApprovalEvent?: Event
}

export const PAGERDUTY_ACTOR: Resource = {
  displayName: 'PagerDuty Approval Bot',
  email: 'bot@indent.com',
  id: 'pagerduty-approval-bot',
  kind: 'indent.v1.Bot',
}

export class PagerdutyDecisionIntegration
  extends BaseHttpIntegration
  implements DecisionIntegration, PullIntegration
{
  _name?: string
  _autoApprovedSchedules?: string[]
  _getApprovalEvent?: any

  constructor(opts?: PagerdutyDecisionIntegrationOpts) {
    super(opts)
    if (opts) {
      this._name = opts.name
      this._autoApprovedSchedules = opts.autoApprovedSchedules
      this._getApprovalEvent = opts.getApprovalEvent
    }
    if (!this._autoApprovedSchedules) {
      if (AUTO_APPROVAL_PAGERDUTY_SCHEDULES !== '') {
        this._autoApprovedSchedules =
          AUTO_APPROVAL_PAGERDUTY_SCHEDULES.split(',')
      }
    }
  }

  HealthCheck(): HealthCheckResponse {
    return { status: { code: 0 } }
  }

  GetInfo(): IntegrationInfoResponse {
    return {
      name: ['indent-integration-pagerduty-decision', this._name]
        .filter(Boolean)
        .join('#'),
      capabilities: ['GetDecision', 'PullUpdate'],
      version,
    }
  }

  async FetchPagerduty(
    config: AxiosRequestConfig
  ): Promise<AxiosResponse<any>> {
    return this.Fetch({
      baseURL: 'https://api.pagerduty.com',
      headers: {
        Authorization: `Token token=${PAGERDUTY_KEY}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      ...config,
    })
  }

  MatchPull(req: PullUpdateRequest): boolean {
    return (
      req.kinds.filter((k) =>
        k.toLowerCase().includes(PAGERDUTY_ACTOR.kind.toLowerCase())
      ).length > 0
    )
  }

  async PullUpdate(req: PullUpdateRequest): Promise<PullUpdateResponse> {
    return {
      status: { code: StatusCode.OK },
      resources: [PAGERDUTY_ACTOR],
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

    const response = await this.FetchPagerduty({
      method: 'get',
      url: '/schedules',
    })

    const schedules = response.data.schedules
    console.log(schedules)

    const approvedSchedules = schedules.filter((s) =>
      this._autoApprovedSchedules
        ? this._autoApprovedSchedules.includes(s.id)
        : true
    )

    const sinceMs = Date.parse(req.events[0].timestamp) || Date.now()
    const before = new Date(sinceMs)
    before.setMinutes(
      before.getMinutes() - parseInt(AUTO_APPROVAL_WINDOW_BEFORE, 10)
    )
    const since = before.toISOString()
    const after = new Date(sinceMs)
    after.setMinutes(
      after.getMinutes() + parseInt(AUTO_APPROVAL_WINDOW_AFTER, 10)
    )
    const until = after.toISOString()

    const onCallResponses = await Promise.all(
      approvedSchedules.map((sched) =>
        this.FetchPagerduty({
          method: 'get',
          url: `/schedules/${sched.id}/users?since=${since}&until=${until}`,
        })
      )
    )
    // array of users from approved schedules
    const approvedOnCallEmails = onCallResponses
      .map((s) => s.data.users)
      .flat()
      .map((u) => u.email)
      .filter(Boolean)
      .reduce((acc, email) => ({ ...acc, [email]: true }), {})

    // get approved on call emails
    const reqEvent = req.events.find((e) => e.event === 'access/request')
    console.log('approvedOnCallEmails:', approvedOnCallEmails)
    console.log('actorEmail:', reqEvent.actor.email)
    if (reqEvent && approvedOnCallEmails[reqEvent.actor.email]) {
      const claim = this._getApprovalEvent
        ? this._getApprovalEvent(reqEvent)
        : getDefaultApprovalEvent(reqEvent)
      res.claims.push(claim)
      console.log('found email in on-call list, auto-approving:', claim)
    } else {
      console.log('skipping, email not found in on-calls')
    }

    return res
  }
}

export function getDefaultApprovalEvent(reqEvent: Event): Event {
  const expireTime = new Date()
  const hours = parseInt(AUTO_APPROVAL_DURATION, 10)

  expireTime.setTime(expireTime.getTime() + hours * 60 * 60 * 1000)

  return {
    actor: PAGERDUTY_ACTOR,
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
