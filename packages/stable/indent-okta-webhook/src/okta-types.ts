import { Resource } from '@indent/types'

export interface OktaGroup {
  id: string
  created: string
  lastUpdated: string
  lastMembershipUpdated: string
  objectClass: string[]
  type: string
  profile: Profile
  _links: Links
}

export interface PartialOktaGroup {
  id: string
  profile: Profile
}

export interface Profile {
  name: string
  description: string
}

export interface Links {
  logo: Logo[]
  users: Users
  apps: Apps
}

export interface Logo {
  name: string
  href: string
  type: string
}

export interface Users {
  href: string
}

export interface Apps {
  href: string
}

export interface approvalEvent {
  actor: {
    id: string
    kind: string
    displayName?: string
    email?: string
  }
  event: string
  meta: {
    labels?: {
      'indent.com/time/duration'?: string
      'indent.com/time/expires'?: string
      'indent.com/workflow/origin/id'?: string
      'indent.com/workflow/origin/run/id'?: string
      petition?: string
    }
  }
  resources: Resource[]
  reason: string
  timestamp?: string
}
