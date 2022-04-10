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
import { AxiosRequestConfig } from 'axios'

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

  FetchOpsgenie(config: AxiosRequestConfig) {
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
    const status = {}
    const claims = []
    const reqEvent = req.events.find((e) => e.event === 'access/request')

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
          url: `/v2/schedules/${sched.id}/on-calls?scheduleIdentifierType=name&flat=false`,
        })
      )
    )

    const onCalls = onCallResponses.map((r) => r.data.data).concat()
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
    const approvedOnCallEmails = approvedOnCallParticipants.flat().reduce(
      (acc, onCallParticipant) => ({
        ...acc,
        [onCallParticipant.name]: true,
      }),
      {}
    ) as Record<string, boolean>
    if (reqEvent && approvedOnCallEmails[reqEvent.actor.email]) {
      const getApprovalEvent =
        this._getApprovalEvent || getDefaultApprovalEvent(reqEvent)
      claims.push(getApprovalEvent)
    }

    return { status, claims }
  }
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
