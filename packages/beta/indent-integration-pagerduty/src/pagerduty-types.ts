export type Schedule = {
  id: string
  type: string
  summary: string
  self: string
  html_url: string
  name: string
  time_zone: string
  description: string
  users: PagerdutyResourceSummary[]
  escalation_policies: any[]
  teams: any[]
}

export type PagerdutyUser = {
  name: string
  email: string
  time_zone: string
  color: string
  avatar_url: string
  billed: boolean
  role: string
  description: true | false | null
  invitation_sent: boolean
  job_title: string
  teams: any[]
  contact_methods: PagerdutyResourceSummary[]
  notification_rules: PagerdutyResourceSummary[]
  coordinated_incidents: any[]
  id: string
  type: string
  summary: string
  self: string
  html_url: string
}

export type PagerdutyResourceSummary = {
  id: string
  type: string
  summary: string
  self: string
  html_url: string
}
