import {
  ApplyUpdateRequest,
  BaseHttpIntegration,
  BaseHttpIntegrationOpts,
  FullIntegration,
  HealthCheckResponse,
  IntegrationInfoResponse,
} from '@indent/base-webhook'
import { AxiosRequestConfig, AxiosResponse } from 'axios'

const GOOGLE_CUSTOMER_ID = process.env.GOOGLE_CUSTOMER_ID
const version = require('../package.json').version

export class GoogleGroupsIntegration
  extends BaseHttpIntegration
  implements FullIntegration
{
  _name?: string

  constructor(opts?: BaseHttpIntegrationOpts) {
    super(opts)
  }

  GetInfo(): IntegrationInfoResponse {
    return {
      name: ['indent-google-groups-webhook', this._name]
        .filter(Boolean)
        .join('#'),
      capabilities: ['ApplyUpdate', 'PullUpdate'],
      version,
    }
  }

  HealthCheck(): HealthCheckResponse {
    return { status: { code: 0 } }
  }

  FetchGoogleGroups(
    config: AxiosRequestConfig<any>
  ): Promise<AxiosResponse<any, any>> {
    config.baseURL = `https://api.github.com/orgs/${GITHUB_ORG}`
    config.headers = {
      Accept: `application/vnd.github.v3+json`,
      Authorization: `token ${GITHUB_TOKEN}`,
    }
    return this.Fetch(config)
  }

  MatchApply(req: WriteRequest): boolean {
    return (
      req.events.filter((e) =>
        Boolean(
          e.resources?.filter((r) =>
            r.kind?.toLowerCase().includes('google.v1.group')
          ).length
        )
      ).length > 0
    )
  }

  async PullUpdate(_req: PullUpdateRequest): Promise<PullUpdateResponse> {}

  async ApplyUpdate(req: ApplyUpdateRequest): Promise<ApplyUpdateResponse> {
    return { status: {} }
  }
}
