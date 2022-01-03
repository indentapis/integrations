import {
  ApplyUpdateResponse,
  Event,
  PullUpdateResponse,
  Status,
} from '@indent/types'

export type BaseRequest = {
  body: string
  secret: string
  headers: { [name: string]: string | string[] | undefined }
}

export type BaseResponse = {
  status: Status
  response?: BaseHttpResponse
}

export type BaseHttpResponse = {
  body: string
  statusCode: number
  headers: { [name: string]: string | string[] | undefined }

  // Optional parsed value of body as `any`
  data?: any
}

export type IntegrationInfo = {
  name: string
  version: string
  capabilities: string[]
}

export type HealthCheckResponse = {
  status: Status
}

export interface BaseIntegration {
  GetInfo(): IntegrationInfo
  HealthCheck(): HealthCheckResponse
}

export interface PullIntegration extends BaseIntegration {
  MatchPull(req: PullUpdateRequest): boolean
  PullUpdate(req: PullUpdateRequest): Promise<PullUpdateResponse>
}

export interface ApplyIntegration extends BaseIntegration {
  MatchApply(req: ApplyUpdateRequest): boolean
  ApplyUpdate(req: ApplyUpdateRequest): Promise<ApplyUpdateResponse>
}

export interface DecisionIntegration extends BaseIntegration {
  MatchDecision(req: DecisionRequest): boolean
  GetDecision(req: DecisionRequest): Promise<DecisionResponse>
}

export interface FullIntegration extends PullIntegration, ApplyIntegration {}
// TODO: move into @indent/types

export type WriteRequest = { events: Event[] }
export type ApplyUpdateRequest = WriteRequest
export type DecisionRequest = WriteRequest
export type PullUpdateRequest = {
  kinds: string[]
  flags?: Record<string, string>
}
export type DecisionResponse = {
  status: Status
  claims: Event[]
}
