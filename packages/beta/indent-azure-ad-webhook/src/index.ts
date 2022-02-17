import {
  ApplyUpdateRequest,
  BaseHttpIntegration,
  BaseHttpIntegrationOpts,
  FullIntegration,
  HealthCheckResponse,
  IntegrationInfoResponse,
  PullUpdateRequest,
  StatusCode,
  WriteRequest,
} from '@indent/base-webhook'
import {
  ApplyUpdateResponse,
  PullUpdateResponse,
  Resource,
} from '@indent/types'
import { AxiosRequestConfig, AxiosResponse } from 'axios'
import { AzureADGroup } from './azure-ad-types'

const version = require('../package.json').version
const AZURE_TENANT_ID = process.env.AZURE_TENANT_ID || ''
const AZURE_CLIENT_ID = process.env.AZURE_CLIENT_ID || ''
const AZURE_REDIRECT_URI = process.env.AZURE_REDIRECT_URI || ''

export class AzureADIntegration
  extends BaseHttpIntegration
  implements FullIntegration
{
  _name?: string

  constructor(opts?: BaseHttpIntegrationOpts) {
    super(opts)
    if (opts) {
      this._name = opts.name
    }
  }

  GetInfo(): IntegrationInfoResponse {
    return {
      version,
      name: 'indent-azure-ad-webhook',
      capabilities: ['ApplyUpdate', 'PullUpdate'],
    }
  }

  HealthCheck(): HealthCheckResponse {
    return { status: { code: 0 } }
  }

  fetchAzureAD(
    config: AxiosRequestConfig<any>
  ): Promise<AxiosResponse<any, any>> {
    config.baseURL = 'https://graph.microsoft.com/v1.0'
    config.headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }
    return this.Fetch(config)
  }

  fetchAzureAuth(
    config: AxiosRequestConfig<any>
  ): Promise<AxiosResponse<any, any>> {
    config.baseURL = `https://login.microsoftonline.com/${AZURE_TENANT_ID}`

    return this.Fetch(config)
  }

  async getAzureAdminConsent() {
    // setup query
    // send request
    // catalog response
  }

  MatchApply(req: WriteRequest): boolean {
    return (
      req.events.filter((e) =>
        Boolean(
          e.resources?.filter((r) =>
            r.kind?.toLowerCase().includes('azure.v1.group')
          ).length
        )
      ).length > 0
    )
  }

  async ApplyUpdate(req: ApplyUpdateRequest): Promise<ApplyUpdateResponse> {
    const auditEvent = req.events.find((e) => /grant|revoke/.test(e.event))
    const { event, resources } = auditEvent
    const user = getAzureIdFromResources(resources, 'user')
    const group = getAzureIdFromResources(resources, 'azure.v1.group')

    const method = event === 'access/grant' ? 'POST' : 'DELETE'
    const response = await this.fetchAzureAD({
      method,
      url: `/groups/${group}/members/$ref}`,
      data: {
        '@data.id': `https://graph.microsoft.com/v1.0/directoryObjects/${user}`,
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

  MatchPull(req: PullUpdateRequest): boolean {
    return req.kinds.map((k) => k.toLowerCase()).includes('azure.v1.group')
  }

  async PullUpdate(_req: PullUpdateRequest): Promise<PullUpdateResponse> {
    if (!this.MatchPull(_req)) {
      return {
        status: {
          code: StatusCode.INVALID_ARGUMENT,
          details: [
            {
              expectedKindLower: 'azure.v1.group',
              actualKinds: _req.kinds,
            },
          ],
        },
      }
    }

    const response = await this.fetchAzureAD({
      method: 'GET',
      url: '/groups',
    })

    const { data: results } = response
    const kind = 'azure.v1.Group'
    const timestamp = new Date().toISOString()
    const resources = results.values.map((r: AzureADGroup) => ({
      id: r.id,
      kind,
      displayName: r.displayName,
      labels: {
        'azure/id': r.id,
        'azure/description': r.description,
        'azure/displayName': r.displayName,
        'azure/createdDateTime': r.createdDateTime,
        'azure/expirationDateTime': r.expirationDateTime,
        'azure/mail': r.mail,
        'azure/visibility': r.visibility,
        timestamp,
      },
    }))

    return { resources }
  }
}

const getAzureIdFromResources = (
  resources: Resource[],
  kind: string
): string => {
  return resources
    .filter((r) => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase()))
    .map((r) => {
      if (r.labels && r.labels['azure/id']) {
        return r.labels['azure/id']
      }

      return r.id
    })[0]
}
