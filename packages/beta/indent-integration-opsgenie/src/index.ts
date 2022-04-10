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

const version = require('../package.json').version

const OPSGENIE_KEY = process.env.OPSGENIE_KEY || ''

export type OpsgenieDecisionIntegrationOpts = BaseHttpIntegrationOpts & {
  autoApprovedSchedules?: string[]
  getApprovalEvent?: Event
}

export class OpsgenieDecisionIntegration
  extends BaseHttpIntegration
  implements DecisionIntegration
{
  _name?: string
  _autoApprovedSchedules?: string[]
  _getApprovalEvent?: any

  constructor(opts?: OpsgenieDecisionIntegrationOpts) {
    super(opts)
    if (opts) {
      this._name = opts.name
      this._autoApprovedSchedules = opts.autoApprovedSchedules
      this._getApprovalEvent = opts.getApprovalEvent
    }
  }

  GetInfo(): IntegrationInfoResponse {
    return {
      version,
      name: 'indent-integration-opsgenie-decision',
      capabilities: ['GetDecision'],
    }
  }

  HealthCheck(): HealthCheckResponse {
    return { status: { code: 0 } }
  }

  MatchDecision(_req: WriteRequest): boolean {
    return true
  }

  FetchOpsgenie(config: AxiosRequestConfig): Promise<AxiosResponse<any>> {
    return this.Fetch({
      baseURL: 'https://api.opsgenie.com',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `GenieKey ${OPSGENIE_KEY}`,
      },
      ...config,
    })
  }

  async GetDecision(req: WriteRequest): Promise<GetDecisionResponse> {
    const res: GetDecisionResponse = {
      status: { code: StatusCode.OK },
      claims: [],
    }

    // get schedules
    const response = await this.FetchOpsgenie({
      method: 'get',
      url: `/v2/schedules`,
    })

    const schedules = response.data.data
    const onCallResponses = await Promise.all(
      schedules.map((sched) =>
        this.FetchOpsgenie({
          method: 'get',
          url: `/v2/schedules/${sched.id}/on-calls?flat=false`,
        })
      )
    )

    log('On-call responses:', onCallResponses)
    const onCalls = onCallResponses.map((r) => r.data.data).concat()
    const approvedOnCallEmails = getApprovedOnCallEmails(onCalls)
    const reqEvent = req.events.find((e) => e.event === 'access/request')

    log('approvedOnCallEmails:', approvedOnCallEmails)
    log('actorEmail:', reqEvent.actor.email)
    if (reqEvent && approvedOnCallEmails[reqEvent.actor.email]) {
      const claim =
        this._getApprovalEvent(reqEvent) || getDefaultApprovalEvent(reqEvent)
      res.claims.push(claim)
      log('found email in on-calls, auto-approving:', claim)
    } else {
      log('skipping, email not found in on-calls')
    }

    return res
  }
}

function log(msg: string, o?: any) {
  console.log(msg + (o ? `\n${JSON.stringify(o)}` : ''))
}

function getApprovedOnCallEmails(onCalls: any) {
  const approvedOnCalls = this._autoApprovedSchedules
    ? onCalls.filter(
        (o) =>
          this._autoApprovedSchedules.includes(o._parent.name) ||
          this._autoApprovedSchedules.includes(o._parent.id)
      )
    : onCalls
  const approvedOnCallParticipants = []
  walk(approvedOnCalls, (o) =>
    o !== undefined && o.onCallParticipants
      ? approvedOnCallParticipants.push(o.onCallParticipants)
      : void 0
  )
  return approvedOnCallParticipants.flat().reduce(
    (acc, onCallParticipant) => ({
      ...acc,
      [onCallParticipant.name]: true,
    }),
    {}
  ) as Record<string, boolean>
}
function walk(o: any, f: Function) {
  f(o)
  if (typeof o !== 'object') return
  if (Array.isArray(o)) return o.forEach((e) => walk(e, f))
  for (let prop in o) walk(o[prop], f)
}

export function getDefaultApprovalEvent(reqEvent: Event): Event {
  let expireTime = new Date()
  let hours = 1

  expireTime.setTime(expireTime.getTime() + 1 * 60 * 60 * 1000)

  return {
    actor: {
      displayName: 'On-call Auto Approval Bot',
      email: 'bot@indent.com',
      id: 'opsgenie-approval-bot',
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
