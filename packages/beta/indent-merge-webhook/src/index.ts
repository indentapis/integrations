import {
  BaseHttpIntegration,
  BaseHttpIntegrationOpts,
  HealthCheckResponse,
  IntegrationInfoResponse,
  PullIntegration,
  PullUpdateRequest,
} from '@indent/base-webhook'
import { PullUpdateResponse } from '@indent/types'

const pkg = require('../package.json')

export class MergeIntegration
  extends BaseHttpIntegration
  implements PullIntegration
{
  _name?: string

  constructor(opts?: BaseHttpIntegrationOpts) {
    super(opts)
  }

  HealthCheck(): HealthCheckResponse {
    return { status: { code: 0 } }
  }

  GetInfo(): IntegrationInfoResponse {
    return {
      name: ['indent-merge-webhook', this._name].filter(Boolean).join('#'),
      capabilities: ['PullUpdate'],
      version: pkg.version,
    }
  }

  MatchPull(req: PullUpdateRequest): boolean {
    return req.kinds.map((k) => k.toLowerCase()).includes('merge.v1.Employee')
  }

  // FetchMerge(
  //   config: AxiosRequestConfig<any>
  // ): Promise<AxiosResponse<any, any>> {
  //   console.log('FetchMerge')
  //   config.baseURL = 'https://api.merge.dev/api/hris/v1'
  //   config.headers = { Authorization: `Bearer ${process.env.MERGE_API_KEY}` }
  //   return this.Fetch(config)
  // }

  async PullUpdate(_req: PullUpdateRequest): Promise<PullUpdateResponse> {
    return {
      resources: [] /*await this.FetchMerge({
        url: '/employees',
      }).then((r) => {
        return r.data.results.map((r) => ({
          id: r.id,
          kind: 'merge.v1.Employee',
          displayName: r.display_full_name,
          email: r.work_email,
          labels: {
            manager: r.manager,
          },
        }))
      }),*/,
    }
  }
}
