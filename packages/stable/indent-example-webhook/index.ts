import {
  ApplyUpdateRequest,
  FullIntegration,
  HealthCheckResponse,
  IntegrationInfo,
  PullUpdateRequest,
} from '@indent/base-webhook'
import { ApplyUpdateResponse, PullUpdateResponse } from '@indent/types'

export class ExampleIntegration implements FullIntegration {
  HealthCheck(): HealthCheckResponse {
    return {
      status: {
        code: 0,
        message: 'OK',
      },
    }
  }

  GetInfo(): IntegrationInfo {
    return {
      name: 'indent-example-webhook',
      capabilities: ['ApplyUpdate', 'PullUpdate'],
      version: '0.0.0',
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

    // TODO: check the results for errors

    return { status: { code: 0 } }
  }

  MatchPull(_req: PullUpdateRequest): boolean {
    return true
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
