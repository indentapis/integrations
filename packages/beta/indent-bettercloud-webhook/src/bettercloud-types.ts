export type BettercloudAction = {
  id: string
  parameters: BettercloudActionParameters[]
  name?: string
  description?: string
}

export type BettercloudActionParameters = {
  id: string
  required: boolean
  name: string
  type: string
}

export type BettercloudWorkflow = {
  workflowId: string
  name: string
}

export interface BettercloudActionResponse extends BettercloudAPIResponse {
  content: BettercloudAction[]
}

export interface BettercloudWorkflowResponse extends BettercloudAPIResponse {
  content: BettercloudWorkflow[]
}

type BettercloudAPIResponse = {
  last: boolean
  totalPages: number
  totalElements: number
  first: boolean
  numberOfElements: number
  size: number
  number: number
}
