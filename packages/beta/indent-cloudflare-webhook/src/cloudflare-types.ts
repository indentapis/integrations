export type CloudflareMembersResponse = {
  success: boolean
  errors: any[]
  messages: any[]
  result: CloudflareMember[]
}

export type CloudflareMember = {
  id: string
  code: string
  user: {
    id: string
    first_name: string
    last_name: string
    email: string
    two_factor_authentication_enabled: boolean
  }
  status: string
  roles: CloudflareRole[]
}

export type CloudflareRole = {
  id: string
  name: string
  description: string
  permissions: {
    analytics: {
      read: boolean
      write: boolean
    }
    billing: {
      read: boolean
      write: boolean
    }
    cache_purge: {
      read: boolean
      write: boolean
    }
    dns: {
      read: boolean
      write: boolean
    }
    dns_records: {
      read: boolean
      write: boolean
    }
    lb: {
      read: boolean
      write: boolean
    }
    logs: {
      read: boolean
      write: boolean
    }
    organization: {
      read: boolean
      write: boolean
    }
    ssl: {
      read: boolean
      write: boolean
    }
    waf: {
      read: boolean
      write: boolean
    }
    zones: {
      read: boolean
      write: boolean
    }
    zone_settings: {
      read: boolean
      write: boolean
    }
  }
}
