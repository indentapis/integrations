import {
  DecisionIntegration,
  DecisionResponse,
  HealthCheckResponse,
  IntegrationInfoResponse,
  WriteRequest,
} from '@indent/base-webhook'
import { Event } from '@indent/types'

export class PagerDutyAutoApprovalIntegration implements DecisionIntegration {
  GetInfo(): IntegrationInfoResponse {
    return {
      name: 'pagerduty-decision-webhook',
      version: '0.0.0',
      capabilities: ['Decision'],
    }
  }

  HealthCheck(): HealthCheckResponse {
    return {
      status: {},
    }
  }

  MatchDecision(req: WriteRequest): boolean {
    return true
  }

  async GetDecision(req: WriteRequest): Promise<DecisionResponse> {
    const accessRequestEvent = req.events.filter(
      (e: Event) => e.event === 'access/request'
    )[0]
    const decision: Event = {
      event: 'access/approve',
      actor: {
        id: 'bot@example.com',
        kind: 'example.v1.Bot',
        displayName: 'Example Auto Approver',
      },
      resources: accessRequestEvent.resources,
      reason: 'auto-approved based on PagerDuty on-call',
      meta: {
        labels: {
          duration: '',
        },
      },
    }

    return {
      status: {},
      claims: [decision],
    }
  }
}
