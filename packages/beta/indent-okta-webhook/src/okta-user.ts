import {
  HealthCheckResponse,
  IntegrationInfo,
  PullIntegration,
  PullUpdateRequest,
} from '@indent/base-webhook'
import { PullUpdateResponse } from '@indent/types'

export class OktaUserIntegration implements PullIntegration {
  GetInfo(): IntegrationInfo {
    return {
      name: 'indent-okta-users-webhook',
      capabilities: ['PullUpdate'],
      version: '0.0.0',
    }
  }

  HealthCheck(): HealthCheckResponse {
    return {
      status: {
        code: 0,
        message: 'OK',
      },
    }
  }

  MatchPull(req: PullUpdateRequest): boolean {
    return req.kinds.map((k) => k.toLowerCase()).includes('okta.v1.user')
  }

  async PullUpdate(_req: PullUpdateRequest): Promise<PullUpdateResponse> {
    return {
      resources: [],
    }
  }
}
