import {
  ApplyUpdateRequest,
  BaseHttpIntegration,
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
import {
  BettercloudAction,
  BettercloudActionResponse,
  BettercloudWorkflow,
  BettercloudWorkflowResponse,
} from './bettercloud-types'

const version = require('../package.json').version

export const BETTERCLOUD_TOKEN = process.env.BETTERCLOUD_TOKEN || ''

export class BettercloudActionIntegration
  extends BaseHttpIntegration
  implements FullIntegration
{
  _name?: string

  HealthCheck(): HealthCheckResponse {
    return { status: { code: 0 } }
  }

  GetInfo(): IntegrationInfoResponse {
    return {
      name: ['indent-bettercloud-action-webhook', this._name]
        .filter(Boolean)
        .join('#'),
      capabilities: ['ApplyUpdate', 'PullUpdate'],
      version,
    }
  }

  FetchBettercloud(
    config: AxiosRequestConfig<any>
  ): Promise<AxiosResponse<any, any>> {
    config.baseURL = `https://api.bettercloud.com`
    config.headers = {
      'Content-Type': 'application/json;charset=UTF-8',
    }
    return this.Fetch(config)
  }

  MatchPull(): boolean {
    return true
  }

  async PullUpdate(_req: PullUpdateRequest): Promise<PullUpdateResponse> {
    const response = await this.FetchBettercloud({
      method: 'GET',
      url: '/v1/actions',
      params: {
        page: 1,
        per_page: 999,
      },
    })

    const { data: results } = response
    const { content } = results as BettercloudActionResponse
    const kind = 'bettercloud.v1.Action'
    const timestamp = new Date().toISOString()
    const resources = content.map((c: BettercloudAction) => ({
      id: c.id,
      kind,
      displayName: c.name,
      labels: {
        'bettercloud/id': c.id,
        'bettercloud/name': c.name,
        'bettercloud/descripton': c.description,
        'bettercloud/parameters': c.parameters.toString(),
        timestamp,
      },
    })) as Resource[]

    return {
      resources,
    }
  }

  MatchApply(req: WriteRequest): boolean {
    return (
      req.events.filter((e) =>
        Boolean(
          e.resources?.filter((r) =>
            r.kind?.toLowerCase().includes('bettercloud.v1.action')
          ).length
        )
      ).length > 0
    )
  }

  async ApplyUpdate(req: ApplyUpdateRequest): Promise<ApplyUpdateResponse> {
    const auditEvent = req.events.find((e) => /grant|revoke/.test(e.event))
    const { event, resources } = auditEvent
    const action = getResourceByKind(resources, 'bettercloud.v1.action')

    let actionId = action.id

    switch (event) {
      case 'access/grant':
        actionId = action.labels.grantActionId
        break
      case 'access/revoke':
        actionId = action.labels.revokeActionId
        break
      default:
        actionId = action.id
    }

    const response = await this.FetchBettercloud({
      method: 'POST',
      url: `/v1/actions/${actionId}/execute`,
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

export class BettercloudWorkflowIntegration
  extends BaseHttpIntegration
  implements FullIntegration
{
  _name?: string

  HealthCheck(): HealthCheckResponse {
    return { status: { code: 0 } }
  }

  GetInfo(): IntegrationInfoResponse {
    return {
      name: ['indent-bettercloud-workflow-webhook', this._name]
        .filter(Boolean)
        .join('#'),
      capabilities: ['ApplyUpdate', 'PullUpdate'],
      version,
    }
  }

  FetchBettercloud(
    config: AxiosRequestConfig<any>
  ): Promise<AxiosResponse<any, any>> {
    config.baseURL = `https://api.bettercloud.com`
    config.headers = {
      'Content-Type': 'application/json;charset=UTF-8',
    }
    return this.Fetch(config)
  }

  MatchPull(): boolean {
    return true
  }

  async PullUpdate(_req: PullUpdateRequest): Promise<PullUpdateResponse> {
    const response = await this.FetchBettercloud({
      method: 'get',
      url: '/v1/workflows',
    })

    const { data: results } = response
    const { content } = results as BettercloudWorkflowResponse
    const kind = 'bettercloud.v1.Workflow'
    const timestamp = new Date().toISOString()
    const resources = content.map((c: BettercloudWorkflow) => ({
      id: c.workflowId,
      kind,
      displayName: c.name,
      labels: {
        'bettercloud/workflowId': c.workflowId,
        'bettercloud/name': c.name,
        timestamp,
      },
    })) as Resource[]

    return {
      resources,
    }
  }

  MatchApply(req: WriteRequest): boolean {
    return (
      req.events.filter((e) =>
        Boolean(
          e.resources?.filter((r) =>
            r.kind?.toLowerCase().includes('bettercloud.v1.workflow')
          ).length
        )
      ).length > 0
    )
  }

  async ApplyUpdate(req: ApplyUpdateRequest): Promise<ApplyUpdateResponse> {
    const auditEvent = req.events.find((e) => /grant|revoke/.test(e.event))
    const { event, resources } = auditEvent
    const workflow = getResourceByKind(resources, 'bettercloud.v1.workflow')

    let workflowId = workflow.id

    switch (event) {
      case 'access/grant':
        workflowId = workflow.labels.grantWorkflowId
        break
      case 'access/revoke':
        workflowId = workflow.labels.revokeWorkflowId
        break
      default:
        workflowId = workflow.id
    }

    const response = await this.FetchBettercloud({
      method: 'POST',
      url: `/v1/workflows/${workflowId}/execute`,
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

function getResourceByKind(resources: Resource[], kind: string): Resource {
  return resources.filter(
    (r) => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase())
  )[0]
}
