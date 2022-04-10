import {
  BaseHttpIntegration,
  BaseHttpIntegrationOpts,
  DecisionIntegration,
  HealthCheckResponse,
  IntegrationInfoResponse,
  WriteRequest,
} from '@indent/base-integration'
import { Event } from '@indent/types'

const pkg = require('../package.json')

export type AutoApproveIntegrationOpts = BaseHttpIntegrationOpts & {
  autoApprovedEmails: string[]
}

export class AutoApproveIntegration
  extends BaseHttpIntegration
  implements DecisionIntegration
{
  _name?: string
  _autoApprovedEmails: string[]

  constructor(opts?: AutoApproveIntegrationOpts) {
    super(opts)
    if (opts) {
      this._name = opts.name
      this._autoApprovedEmails = opts.autoApprovedEmails
    }
  }

  HealthCheck(): HealthCheckResponse {
    return { status: { code: 0 } }
  }

  GetInfo(): IntegrationInfoResponse {
    return {
      name: ['indent-auto-webhook', this._name].filter(Boolean).join('#'),
      capabilities: ['GetDecision'],
      version: pkg.version,
    }
  }

  MatchDecision(_req: WriteRequest): boolean {
    return true
  }

  async GetDecision(req: WriteRequest): Promise<DecisionResponse> {
    const status = {}
    const claims = []
    const reqEvent = req.events.find((e) => e.event === 'access/request')

    if (reqEvent && this._autoApprovedEmails.includes(reqEvent.actor.email)) {
      claims.push(getApprovalEvent(reqEvent))
    }

    return { status, claims }
  }
}

function getApprovalEvent(reqEvent: Event) {
  let expireTime = new Date()
  let hours = 1

  expireTime.setTime(expireTime.getTime() + 1 * 60 * 60 * 1000)

  return {
    actor: {
      displayName: 'Auto Approval Bot',
      email: 'bot@indent.com',
      id: '',
      kind: 'bot.v1.user',
    },
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
