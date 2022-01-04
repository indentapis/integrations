import {
  ApplyUpdateRequest,
  FullIntegration,
  HealthCheckResponse,
  IntegrationInfoResponse,
  PullUpdateRequest,
} from '@indent/base-webhook'
import { ApplyUpdateResponse, PullUpdateResponse } from '@indent/types'

const pkg = require('../package.json')

export class NewIntegration implements FullIntegration {
  _name?: string

  constructor(opts?: { name: string }) {
    if (opts) {
      this._name = opts.name
    }
  }

  HealthCheck(): HealthCheckResponse {
    return { status: { code: 0 } }
  }

  GetInfo(): IntegrationInfoResponse {
    return {
      name: ['indent-example-webhook', this._name].filter(Boolean).join('#'),
      capabilities: ['ApplyUpdate', 'PullUpdate'],
      version: pkg.version,
    }
  }

  MatchApply(_req: ApplyUpdateRequest): boolean {
    return true
  }

  async ApplyUpdate(req: ApplyUpdateRequest): Promise<ApplyUpdateResponse> {
    const { events } = req
    const results = await Promise.all(
      events.map((auditEvent) => {
        switch (auditEvent.event) {
          case 'access/grant':
            // Grant permission
            return Promise.resolve()
          case 'access/revoke':
            // Revoke permission
            return Promise.resolve()
          default:
            return Promise.resolve()
        }
      })
    )

    // TODO: check results for errors

    return {
      status: { code: 0, details: { debugOutcome: 'success', results } },
    }
  }

  MatchPull(req: PullUpdateRequest): boolean {
    return req.kinds.map((k) => k.toLowerCase()).includes('example.v1.group')
  }

  async PullUpdate(_req: PullUpdateRequest): Promise<PullUpdateResponse> {
    return {
      resources: [
        {
          id: 'example-0001',
          kind: 'example.v1.Group',
          displayName: `Example Group #1`,
        },
      ],
    }
  }
}
