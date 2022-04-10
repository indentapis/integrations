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

export type IntegrationInfoResponse = {
  name: string
  version: string
  capabilities: string[]
}

export type HealthCheckResponse = {
  status: Status
  info?: IntegrationInfoResponse
}

export interface BaseIntegration {
  GetInfo(): IntegrationInfoResponse
  HealthCheck(): HealthCheckResponse
}

export interface PullIntegration extends BaseIntegration {
  MatchPull?(req: PullUpdateRequest): boolean
  PullUpdate(req: PullUpdateRequest): Promise<PullUpdateResponse>
}

export interface ApplyIntegration extends BaseIntegration {
  MatchApply?(req: ApplyUpdateRequest): boolean
  ApplyUpdate(req: ApplyUpdateRequest): Promise<ApplyUpdateResponse>
}

export interface DecisionIntegration extends BaseIntegration {
  MatchDecision(req: GetDecisionRequest): boolean
  GetDecision(req: GetDecisionRequest): Promise<GetDecisionResponse>
}

export interface FullIntegration extends PullIntegration, ApplyIntegration {}
// TODO: move into @indent/types

export type WriteRequest = { events: Event[] }
export type ApplyUpdateRequest = WriteRequest
export type PullUpdateRequest = {
  kinds: string[]
  flags?: Record<string, string>
}
export type GetDecisionRequest = WriteRequest
export type GetDecisionResponse = {
  status: Status
  claims: Event[]
}

export enum StatusCode {
  OK = 0,
  CANCELLED = 1,
  UNKNOWN = 2,
  INVALID_ARGUMENT = 3,
  DEADLINE_EXCEEDED = 4,
  NOT_FOUND = 5,
  ALREADY_EXISTS = 6,
  PERMISSION_DENIED = 7,
  RESOURCE_EXHAUSTED = 8,
  FAILED_PRECONDITION = 9,
  ABORTED = 10,
  OUT_OF_RANGE = 11,
  UNIMPLEMENTED = 12,
  INTERNAL = 13,
  UNAVAILABLE = 14,
  DATA_LOSS = 15,
  UNAUTHENTICATED = 16,
}
