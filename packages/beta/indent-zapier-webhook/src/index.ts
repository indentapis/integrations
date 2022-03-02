import {
  ApplyIntegration,
  ApplyUpdateRequest,
  BaseHttpIntegration,
  BaseHttpIntegrationOpts,
  HealthCheckResponse,
  IntegrationInfoResponse,
  PullUpdateRequest,
  StatusCode,
} from '@indent/base-webhook'
import { ApplyUpdateResponse, PullUpdateResponse } from '@indent/types'
import { AxiosRequestConfig, AxiosResponse } from 'axios'

const { version } = require('../package.json')
const ZAP_ENDPOINT = process.env.ZAP_ENDPOINT || ''

export class ZapierIntegration
  extends BaseHttpIntegration
  implements ApplyIntegration
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
      name: ['indent-zapier-webhook', this._name].filter(Boolean).join('#'),
      capabilities: ['ApplyUpdate', 'PullUpdate'],
      version,
    }
  }

  FetchZapier(
    config: AxiosRequestConfig<any>
  ): Promise<AxiosResponse<any, any>> {
    config.baseURL = /http/.test(ZAP_ENDPOINT)
      ? ZAP_ENDPOINT
      : `https://${ZAP_ENDPOINT}`
    return this.Fetch(config)
  }

  async PullUpdate(_req: PullUpdateRequest): Promise<PullUpdateResponse> {
    return {}
  }

  async ApplyUpdate(req: ApplyUpdateRequest): Promise<ApplyUpdateResponse> {
    const auditEvent = req.events.find((e) => /grant|revoke/.test(e.event))
    const response = await this.FetchZapier({
      method: 'POST',
      data: {
        ...auditEvent,
      },
    })

    if (response.status > 204) {
      return {
        status: {
          code: StatusCode.UNKNOWN,
          details: { errorData: response.data },
        },
      }
    }
    return { status: {} }
  }
}
