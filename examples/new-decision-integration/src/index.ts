import {
  DecisionIntegration,
  DecisionRequest,
  DecisionResponse,
  HealthCheckResponse,
  IntegrationInfoResponse,
  StatusCode,
} from '@indent/base-integration'

const pkg = require('../package.json')

export class NewIntegration implements DecisionIntegration {
  _name?: string

  constructor(opts?: { name: string }) {
    if (opts) {
      this._name = opts.name
    }
  }

  HealthCheck(): HealthCheckResponse {
    return {
      status: { code: 0 },
    }
  }

  GetInfo(): IntegrationInfoResponse {
    return {
      name: ['indent-example-webhook', this._name].filter(Boolean).join('#'),
      capabilities: ['Apply', 'Pull'],
      version: pkg.version,
    }
  }

  MatchDecision(_req: DecisionRequest): boolean {
    return true
  }

  async GetDecision(req: DecisionRequest): Promise<DecisionResponse> {
    const { events } = req
    const reqEvent = events[0]

    // process request event

    return {
      status: { code: StatusCode.OK },
      claims: [
        {
          event: 'access/approve',
          actor: { id: 'auto-approval', displayName: 'On-call Auto Approval' },
        },
      ],
    }
  }
}
