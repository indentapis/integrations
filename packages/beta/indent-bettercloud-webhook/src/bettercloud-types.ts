export type BetterCloudAction = {
  id: string
  parameters: BetterCloudActionParameters[]
  name?: string
  description?: string
}

export type BetterCloudActionParameters = {
  id: string
  required: boolean
  name: string
  type: string
}

export type BetterCloudWorkflow = {
  workflowId: string
  name: string
}

export interface BetterCloudActionResponse extends BetterCloudAPIResponse {
  content: BetterCloudAction[]
}

export interface BetterCloudWorkflowResponse extends BetterCloudAPIResponse {
  content: BetterCloudWorkflow[]
}

type BetterCloudAPIResponse = {
  last: boolean
  totalPages: number
  totalElements: number
  first: boolean
  numberOfElements: number
  size: number
  number: number
}
