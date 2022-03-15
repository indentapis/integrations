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
import {
  BetterCloudAction,
  BetterCloudActionResponse,
  BetterCloudWorkflow,
  BetterCloudWorkflowResponse,
} from './bettercloud-types'

const version = require('../package.json').version

export const BETTERCLOUD_TOKEN = process.env.BETTERCLOUD_TOKEN || ''

export class BetterCloudActionIntegration
  extends BaseHttpIntegration
  implements FullIntegration
{
  constructor(opts?: BaseHttpIntegrationOpts) {
    super(opts)
    if (opts) {
      this._name = opts.name
    }
  }

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

  FetchBetterCloud(
    config: AxiosRequestConfig<any>
  ): Promise<AxiosResponse<any, any>> {
    config.baseURL = `https://app.bettercloud.com/api/v1`
    config.headers = {
      'Content-Type': 'application/json;charset=UTF-8',
      Authorization: `${BETTERCLOUD_TOKEN}`,
    }
    return this.Fetch(config)
  }

  MatchPull(): boolean {
    return true
  }

  async PullUpdate(_req: PullUpdateRequest): Promise<PullUpdateResponse> {
    const response = await this.FetchBetterCloud({
      method: 'GET',
      url: '/actions',
      params: {
        page: 1,
        per_page: 999,
      },
    })

    const { data: results } = response
    const { content } = results as BetterCloudActionResponse
    const kind = 'bettercloud.v1.Action'
    const timestamp = new Date().toISOString()
    const resources = content.map((c: BetterCloudAction) => ({
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

    const response = await this.FetchBetterCloud({
      method: 'POST',
      url: `/actions/${actionId}/execute`,
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

export class BetterCloudWorkflowIntegration
  extends BaseHttpIntegration
  implements FullIntegration
{
  constructor(opts?: BaseHttpIntegrationOpts) {
    super(opts)
    if (opts) {
      this._name = opts.name
    }
  }

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

  FetchBetterCloud(
    config: AxiosRequestConfig<any>
  ): Promise<AxiosResponse<any, any>> {
    config.baseURL = `https://app.bettercloud.com/api/v1`
    config.headers = {
      'Content-Type': 'application/json;charset=UTF-8',
      Authorization: `${BETTERCLOUD_TOKEN}`,
    }
    return this.Fetch(config)
  }

  MatchPull(): boolean {
    return true
  }

  async PullUpdate(_req: PullUpdateRequest): Promise<PullUpdateResponse> {
    const response = await this.FetchBetterCloud({
      method: 'get',
      url: '/workflows',
    })

    const { data: results } = response
    const { content } = results as BetterCloudWorkflowResponse
    const kind = 'bettercloud.v1.Workflow'
    const timestamp = new Date().toISOString()
    const resources = content.map((c: BetterCloudWorkflow) => ({
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

    const response = await this.FetchBetterCloud({
      method: 'POST',
      url: `/workflows/${workflowId}/execute`,
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
