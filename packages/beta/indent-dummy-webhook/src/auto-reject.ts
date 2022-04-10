import {
  DecisionIntegration,
  GetDecisionResponse,
  HealthCheckResponse,
  IntegrationInfoResponse,
  WriteRequest,
} from '@indent/base-integration'
import { Event } from '@indent/types'

export class AutoRejectIntegration implements DecisionIntegration {
  _name?: string

  constructor(opts?: { name: string }) {
    if (opts) {
      this._name = opts.name
    }
  }

  GetInfo(): IntegrationInfoResponse {
    return {
      name: ['auto-reject-decision-webhook', this._name]
        .filter(Boolean)
        .join('#'),
      version: '0.0.0',
      capabilities: ['Decision'],
    }
  }

  HealthCheck(): HealthCheckResponse {
    return {
      status: {},
    }
  }

  MatchDecision(): boolean {
    return true
  }

  async GetDecision(req: WriteRequest): Promise<GetDecisionResponse> {
    const accessRequestEvent = req.events.filter(
      (e: Event) => e.event === 'access/request'
    )[0]
    const decision: Event = {
      event: 'access/deny',
      actor: {
        id: 'bot@example.com',
        kind: 'example.v1.Bot',
        displayName: 'Example Auto Approver',
      },
      resources: accessRequestEvent.resources,
      reason: 'auto-denied because this webhook is for testing',
    }

    return {
      status: {},
      claims: [decision],
    }
  }
}
