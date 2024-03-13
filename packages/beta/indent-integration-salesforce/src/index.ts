import {
  ApplyUpdateRequest,
  BaseHttpIntegration,
  BaseHttpIntegrationOpts,
  FullIntegration,
  HealthCheckResponse,
  IntegrationInfoResponse,
  PullUpdateRequest,
  StatusCode,
  WriteRequest,
} from '@indent/base-integration'
import {
  ApplyUpdateResponse,
  PullUpdateResponse,
  Resource,
} from '@indent/types'
import jsforce from 'jsforce'
import {
  SalesforceUserInfoResponse,
  SalesforceUserRolesResponse,
} from './salesforce-types'

const pkg = require('../package.json')
const SALESFORCE_INSTANCE_URL = process.env.SALESFORCE_INSTANCE_URL
const SALESFORCE_ACCESS_TOKEN = process.env.SALESFORCE_ACCESS_TOKEN

export class SalesforceIntegration
  extends BaseHttpIntegration
  implements FullIntegration
{
  _conn
  constructor(opts?: BaseHttpIntegrationOpts) {
    super(opts)
    if (opts) {
      this._name = opts.name
    }
  }

  HealthCheck(): HealthCheckResponse {
    return { status: { code: 0 } }
  }

  GetInfo(): IntegrationInfoResponse {
    return {
      name: ['indent-salesforce-webhook', this._name].filter(Boolean).join('#'),
      capabilities: ['ApplyUpdate', 'PullUpdate'],
      version: pkg.version,
    }
  }

  MatchApply(req: WriteRequest): boolean {
    return req.events.some((e) =>
      e.resources?.some((r) =>
        r.kind?.toLowerCase().includes('salesforce.v1.user')
      )
    )
  }

  async ConnectSalesforce(): Promise<void> {
    try {
      this._conn = new jsforce.Connection({
        instanceUrl: SALESFORCE_INSTANCE_URL,
        accessToken: SALESFORCE_ACCESS_TOKEN,
      })
    } catch (err) {
      console.error('Error connecting to Salesforce:', err)
      throw err
    }
  }

  MatchPull(req) {
    const lowercaseKinds = req.kinds.map((k) => k.toLowerCase())
    return (
      lowercaseKinds.includes('salesforce.v1.userrole') ||
      lowercaseKinds.includes('salesforce.v1.user')
    )
  }

  async PullUpdate(_req: PullUpdateRequest): Promise<PullUpdateResponse> {
    if (!this._conn) {
      this.ConnectSalesforce()
    }

    let resources: Resource[] = []
    const timestamp = new Date().toISOString()
    let res = { status: { code: StatusCode.UNKNOWN, message: '' } }
    if (this.MatchPull(_req)) {
      if (_req.kinds.includes('salesforce.v1.userRole')) {
        try {
          const userRole: SalesforceUserRolesResponse = await this._conn.query(
            'SELECT Id, Name FROM UserRole'
          )
          console.log(`debug userRole: ${JSON.stringify(userRole, null, 1)}`)

          resources = userRole.records.map((r) => ({
            id: r.Id,
            displayName: r.Name,
            kind: 'salesforce.v1.userRole',
            labels: {
              description: r.Name,
              timestamp,
            },
          })) as Resource[]
          console.log(
            `debug resources for UserRole: ${JSON.stringify(
              resources,
              null,
              1
            )}`
          )
          res.status.code = StatusCode.OK
        } catch (err) {
          res.status.code = StatusCode.UNAVAILABLE
          res.status.message = err.message
          console.error(res.status.message)
        }
      }

      if (_req.kinds.includes('salesforce.v1.user')) {
        try {
          const userInfo: SalesforceUserInfoResponse = await this._conn.query(
            'SELECT Id, Name, IsActive, UserRole.Name, Profile.UserLicense.Name FROM User'
          )
          console.log(`debug userInfo: ${JSON.stringify(userInfo, null, 1)}`)

          const userInfoResources: Resource[] = userInfo.records.map((r) => ({
            id: r.Id,
            displayName: r.Name,
            kind: 'salesforce.v1.user',
            labels: {
              description: r.Name,
              timestamp,
              'salesforce/isActive': r.IsActive.toString(),
              'salesforce/role': r.UserRole?.Name ? r.UserRole?.Name : null,
              'salesforce/userLicense': r.Profile?.UserLicense?.Name
                ? r.Profile?.UserLicense?.Name
                : null,
            },
          })) as Resource[]
          console.log(
            `debug resources for UserInfo: ${JSON.stringify(
              userInfoResources,
              null,
              1
            )}`
          )

          resources = resources.concat(userInfoResources)
          res.status.code = StatusCode.OK
        } catch (err) {
          res.status.code = StatusCode.UNAVAILABLE
          res.status.message = err.message
          console.error(res.status.message)
        }
      }
    }

    return {
      status: res.status,
      resources,
    }
  }

  async ApplyUpdate(_req: ApplyUpdateRequest): Promise<ApplyUpdateResponse> {
    if (!this._conn) {
      this.ConnectSalesforce()
    }
    const auditEvent = _req.events.find((e) => /grant|revoke/.test(e.event))
    const { event, resources } = auditEvent
    const granted = getResourceByKind(resources, 'salesforce.v1.user')
    let res = { status: { code: StatusCode.UNKNOWN, message: '' } }
    if (this.MatchApply(_req)) {
      try {
        if (event === 'access/grant') {
          if (granted.kind === 'salesforce.v1.user') {
            const isActive = event === 'access/grant'
            await this._conn.sobject('User').update({
              Id: granted.id,
              IsActive: isActive,
            })
          }
          res.status.code = StatusCode.OK
        } else if (event === 'access/revoke') {
          if (granted.kind === 'salesforce.v1.user') {
            // For deactivating users when revoking access
            await this._conn.sobject('User').update({
              Id: granted.id,
              IsActive: false,
            })
          }

          res.status.code = StatusCode.OK
        }
      } catch (err) {
        res.status.code = StatusCode.UNAVAILABLE
        res.status.message = err.message
        console.error(res.status.message)
      }
    }
    return res
  }
}

function getResourceByKind(resources, kind) {
  return resources.find(
    (r) => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase())
  )
}
