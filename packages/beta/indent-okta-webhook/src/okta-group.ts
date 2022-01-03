import {
  ApplyIntegration,
  ApplyUpdateRequest,
  HealthCheckResponse,
  IntegrationInfo,
  WriteRequest,
} from '@indent/base-webhook'
import { ApplyUpdateResponse } from '@indent/types'
import { callOktaAPI } from './api'

export class OktaGroupIntegration implements ApplyIntegration {
  GetInfo(): IntegrationInfo {
    return {
      name: 'indent-okta-groups-webhook',
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

  MatchApply(req: WriteRequest): boolean {
    return (
      req.events.filter((e) =>
        Boolean(
          e.resources?.filter((r) =>
            r.kind?.toLowerCase().includes('okta.v1.group')
          ).length
        )
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

  // PullUpdate(kinds: string[], flags?: Record<string,string>): PullUpdateResponse {
  //   return {
  //     resources: []
  //   }
  // }
}
