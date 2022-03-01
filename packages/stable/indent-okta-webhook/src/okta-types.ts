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
