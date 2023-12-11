interface Attributes {
  type: string
  url: string
}

interface UserRecord {
  attributes: Attributes
  Id: string
  Name: string
  Profile: {
    attributes: Attributes
    Id: string
    Name: string
    UserLicense: {
      attributes: Attributes
      Id: string
      Name: string
    }
  } | null
}

export interface SalesforceUsers {
  totalSize: number
  done: boolean
  records: UserRecord[]
}
