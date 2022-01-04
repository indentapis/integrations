import {
  ApplyIntegration,
  ApplyUpdateRequest,
  HealthCheckResponse,
  IntegrationInfoResponse,
} from '@indent/base-webhook'
import { ApplyUpdateResponse } from '@indent/types'
import { callOktaAPI } from './api'

export class OktaProfileIntegration implements ApplyIntegration {
  GetInfo(): IntegrationInfoResponse {
    return {
      name: 'indent-okta-profile-webhook',
      capabilities: ['ApplyUpdate'],
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

  MatchApply(req: ApplyUpdateRequest): boolean {
    const event = req.events.filter(
      (e) => e.event === 'access/grant' || e.event === 'access/revoke'
    )[0]

    if (!event.resources) {
      return false
    }

    return (
      event.resources.filter((r) =>
        r.kind?.toLowerCase().includes('okta.v1.group')
      ).length > 0
    )
  }

  async ApplyUpdate(_req: ApplyUpdateRequest): Promise<ApplyUpdateResponse> {
    const group = '0123'
    const user = 'u1'
    const { status, response } = await callOktaAPI({
      method: 'PUT',
      url: `/api/v1/groups/${group}/users/${user}`,
    })

    // TODO: log response
    console.log(response)

    return { status }
  }
}
