export type SalesforceMembersResponse = {
  totalSize: boolean
  done: boolean
  records: SalesforceMember[]
}

export type SalesforceUserRolesResponse = {
  totalSize: number
  done: boolean
  records: SalesforceRole[]
}

export type SalesforceMember = {
  attributes: {
    type: string
    url: string
  }
  Id: string
  Name: string
  UserRole: SalesforceRole | null
}

export type SalesforceRole = {
  attributes: {
    type: string
    url: string
  }
  Name: string
  Id: string
}

export type SalesforceUserInfoResponse = {
  totalSize: number
  done: boolean
  records: SalesforceUserInfo[]
}

export type SalesforceUserInfo = {
  attributes: {
    type: string
    url: string
  }
  Id: string
  Name: string
  IsActive: boolean
  Profile: SalesforceProfile | null
  UserRole: SalesforceRole | null
}

export type SalesforceProfile = {
  attributes: {
    type: string
    url: string
  }
  Id: string
  Name: string
  UserLicense: SalesforceUserLicense
}

export type SalesforceUserLicense = {
  attributes: {
    type: string
    url: string
  }
  Id: string
  Name: string
}
