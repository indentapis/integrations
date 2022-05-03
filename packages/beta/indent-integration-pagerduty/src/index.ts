import {
  BaseHttpIntegration,
  BaseHttpIntegrationOpts,
  DecisionIntegration,
  GetDecisionResponse,
  HealthCheckResponse,
  IntegrationInfoResponse,
  StatusCode,
  WriteRequest,
} from '@indent/base-integration'
import { Event } from '@indent/types'
import { AxiosRequestConfig, AxiosResponse } from 'axios'

const { version } = require('../package.json')
const PAGERDUTY_KEY = process.env.PAGERDUTY_KEY || ''

export type PagerdutyDecisionIntegrationOpts = BaseHttpIntegrationOpts & {
  autoApprovedSchedules?: string[]
  getApprovalEvent?: Event
}

export class PagerdutyDecisionIntegration
  extends BaseHttpIntegration
  implements DecisionIntegration
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
  }

  HealthCheck(): HealthCheckResponse {
    return { status: { code: 0 } }
  }

  GetInfo(): IntegrationInfoResponse {
    return {
      name: ['indent-integration-pagerduty-decision', this._name]
        .filter(Boolean)
        .join('#'),
      capabilities: ['GetDecision'],
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

    const onCallResponses = await Promise.all(
      approvedSchedules.map((sched) =>
        this.FetchPagerduty({
          method: 'get',
          url: `/schedules/${sched.id}/users`,
        })
      )
    )
    // array of users from approved schedules
    const approvedOnCallEmails = onCallResponses
      .map((s) => s.data.users)
      .flat()
      .map((u) => u.email)
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
  let expireTime = new Date()
  let hours = 1

  expireTime.setTime(expireTime.getTime() + 1 * 60 * 60 * 1000)

  return {
    actor: {
      displayName: 'On-call Auto Approval Bot',
      email: 'bot@indent.com',
      id: 'pagerduty-approval-bot',
      kind: 'bot.v1.user',
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
    reason: 'Auto-approved based on being on-call',
  }
}
