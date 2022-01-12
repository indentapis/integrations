export type AtspokeRequest = {
  subject: string
  requester: string
  body?: string
  team?: string
  owner?: string
  privacyLevel?: 'private' | 'public'
  requestTypeInfo?: AtspokeRequestTypeInfo
  requestType?: string
}

export type AtspokeRequestTypeInfo = {
  answeredFields: {
    fieldId: string
    value: string
  }[]
}

export type AtspokeUser = {
  org: string
  user: string
  role: string
  status: string
  displayName?: string
}
