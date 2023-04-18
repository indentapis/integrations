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

const version = require('../package.json').version

const OPSGENIE_KEY = process.env.OPSGENIE_KEY || ''
const AUTO_APPROVAL_DURATION = process.env.AUTO_APPROVAL_DURATION || '6'
const AUTO_APPROVAL_SCHEDULES = process.env.AUTO_APPROVAL_SCHEDULES || ''

export type OpsgenieDecisionIntegrationOpts = BaseHttpIntegrationOpts & {
  autoApprovedSchedules?: string[]
  getApprovalEvent?: Event
}

export const OPSGENIE_ACTOR: Resource = {
  displayName: 'OpsGenie Approval Bot',
  email: 'bot@indent.com',
  id: 'opsgenie-approval-bot',
  kind: 'indent.v1.Bot',
}

export class OpsgenieDecisionIntegration
  extends BaseHttpIntegration
  implements DecisionIntegration, PullIntegration
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
    if (!this._autoApprovedSchedules) {
      if (AUTO_APPROVAL_SCHEDULES !== '') {
        this._autoApprovedSchedules = AUTO_APPROVAL_SCHEDULES.split(',')
      }
    }
  }

  GetInfo(): IntegrationInfoResponse {
    return {
      version,
      name: 'indent-integration-opsgenie-decision',
      capabilities: ['GetDecision', 'PullUpdate'],
    }
  }

  HealthCheck(): HealthCheckResponse {
    return { status: { code: 0 } }
  }

  async PullUpdate(req: PullUpdateRequest): Promise<PullUpdateResponse> {
    return {
      status: { code: StatusCode.OK },
      resources: [OPSGENIE_ACTOR],
    }
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

    const onCalls = onCallResponses.map((r) => r.data.data).concat()
    const approvedOnCallEmails = getApprovedOnCallEmails(
      onCalls,
      this._autoApprovedSchedules
    )
    const reqEvent = req.events.find((e) => e.event === 'access/request')

    log('onCalls:', onCalls)
    log('approvedOnCallEmails:', approvedOnCallEmails)
    log('actorEmail:', reqEvent.actor.email)
    if (reqEvent && approvedOnCallEmails[reqEvent.actor.email]) {
      const claim = this._getApprovalEvent
        ? this._getApprovalEvent(reqEvent)
        : getDefaultApprovalEvent(reqEvent)
      res.claims.push(claim)
      log('found email in on-calls, auto-approving:', claim)
    } else {
      log('skipping, email not found in on-calls')
    }

    log('GetDecision.result:', res)
    return res
  }
}

function log(msg: string, o?: any) {
  console.log(msg + (o ? `\n${JSON.stringify(o)}` : ''))
}

function getApprovedOnCallEmails(onCalls: any, autoApprovedSchedules?: any) {
  const approvedOnCalls = autoApprovedSchedules
    ? onCalls.filter(
        (o) =>
          autoApprovedSchedules.includes(o._parent.name) ||
          autoApprovedSchedules.includes(o._parent.id)
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
  const expireTime = new Date()
  const hours = parseFloat(AUTO_APPROVAL_DURATION)

  expireTime.setTime(expireTime.getTime() + hours * 60 * 60 * 1000)

  return {
    actor: OPSGENIE_ACTOR,
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
