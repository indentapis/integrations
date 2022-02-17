export interface MicrosoftGraphResponse {
  '@data.context': string
  value: any[]
}

export type AzureADGroup = {
  id: string
  deletedDateTime: string | null
  classification: string | null
  createdDateTime: string
  creationOptions: string[]
  description: string
  displayName: string
  expirationDateTime: string | null
  groupTypes: string[]
  isAssignableToRole: string | null
  mail: string
  mailEnabled: boolean
  mailNickname: string
  membershipRule: string | null
  membershipRuleProcessingState: string | null
  onPremisesDomainName: string | null
  onPremisesLastSyncDateTime: string | null
  onPremisesNetBiosName: string | null
  onPremisesSamAccountName: string | null
  onPremisesSecurityIdentifier: string | null
  onPremisesSyncEnabled: string | null
  preferredDataLocation: string | null
  preferredLanguage: string | null
  proxyAddresses: string[]
  renewedDateTime: string
  resourceBehaviorOptions: string[] | null[]
  resourceProvisioningOptions: string[]
  securityEnabled: false
  securityIdentifier: string
  theme: string | null
  visibility: string
  onPremisesProvisioningErrors: string[]
}
