import {
  BaseHttpIntegration,
  BaseHttpIntegrationOpts,
  DecisionIntegration,
  GetDecisionResponse,
  HealthCheckResponse,
  IntegrationInfoResponse,
  PullIntegration,
  StatusCode,
  WriteRequest,
} from '@indent/base-integration'
import { Event, PullUpdateResponse, Resource } from '@indent/types'

const pkg = require('../package.json')

const AUTO_APPROVAL_DURATION = process.env.AUTO_APPROVAL_DURATION || '1'

export const AUTO_APPROVAL_ACTOR: Resource = {
  displayName: 'Auto Approval Bot',
  email: 'bot@indent.com',
  id: 'auto-approval-bot',
  kind: 'indent.v1.Bot',
}

export class AutoApproveIntegration
  extends BaseHttpIntegration
  implements DecisionIntegration, PullIntegration
{
  _name?: string

  constructor(opts?: BaseHttpIntegrationOpts) {
    super(opts)
    if (opts) {
      this._name = opts.name
    }
  }

  HealthCheck(): HealthCheckResponse {
    return { status: { code: 0 } }
  }

  GetInfo(): IntegrationInfoResponse {
    return {
      name: ['indent-auto-approvals', this._name].filter(Boolean).join('#'),
      capabilities: ['PullUpdate', 'GetDecision'],
      version: pkg.version,
    }
  }

  async PullUpdate(): Promise<PullUpdateResponse> {
    return {
      status: { code: StatusCode.OK },
      resources: [AUTO_APPROVAL_ACTOR],
    }
  }

  async GetDecision(req: WriteRequest): Promise<GetDecisionResponse> {
    const status = {}
    const reqEvent = req.events.find((e) => e.event === 'access/request')
    return { status, claims: [getApprovalEvent(reqEvent)] }
  }
}

function getApprovalEvent(reqEvent: Event) {
  const expireTime = new Date()
  const hours = parseInt(AUTO_APPROVAL_DURATION, 10)

  expireTime.setTime(expireTime.getTime() + hours * 60 * 60 * 1000)

  return {
    actor: AUTO_APPROVAL_ACTOR,
    event: 'access/approve',
    meta: {
      labels: {
        'indent.com/time/duration': `${hours}h0m0s`,
        'indent.com/time/expires': expireTime.toISOString(),
        'indent.com/workflow/origin/id':
          reqEvent.meta.labels['indent.com/workflow/origin/id'],
        'indent.com/workflow/origin/run/id':
          reqEvent.meta.labels['indent.com/workflow/origin/run/id'],
        petition: reqEvent.meta.labels.petition,
      },
    },
    resources: [reqEvent.actor, ...reqEvent.resources],
    timestamp: new Date().toISOString(),
    reason: 'Auto-approved based on email',
  }
}
