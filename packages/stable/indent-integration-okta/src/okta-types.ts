export interface OktaApp {
  id: string
  name: string
  label: string
  _links: {
    logo: Link[]
    appLinks: Link[]
  }
}

export interface OktaGroup {
  id: string
  created: string
  lastUpdated: string
  lastMembershipUpdated: string
  objectClass: string[]
  type: string
  profile: Profile
  _links: {
    logo: Link[]
    users: Link
    apps: Link
  }
}

export interface PartialOktaGroup {
  id: string
  profile: Profile
}

export interface Profile {
  name: string
  description: string
}

export interface Link {
  href: string
  name?: string
  type?: string
}
