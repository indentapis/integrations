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
import { SalesforceUsers } from './salesforce-types'

const pkg = require('../package.json')
const SALESFORCE_INSTANCE_URL = process.env.SALESFORCE_INSTANCE_URL
const SALESFORCE_ACCESS_TOKEN = process.env.SALESFORCE_ACCESS_TOKEN

export class SalesforceIntegration
  extends BaseHttpIntegration
  implements FullIntegration
{
  conn
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
    return (
      req.events.filter((e) =>
        Boolean(
          e.resources?.filter((r) =>
            r.kind?.toLowerCase().includes('salesforce.v1.userlicense')
          ).length
        )
      ).length > 0
    )
  }

  async ConnectSalesforce(): Promise<void> {
    this.conn = new jsforce.Connection({
      instanceUrl: SALESFORCE_INSTANCE_URL,
      accessToken: SALESFORCE_ACCESS_TOKEN,
    })
  }

  MatchPull(req) {
    return req.kinds
      .map((k) => k.toLowerCase())
      .includes('salesforce.v1.userlicense')
  }

  async PullUpdate(_req: PullUpdateRequest): Promise<PullUpdateResponse> {
    if (!this.conn) {
      this.ConnectSalesforce()
    }
    const userLicenses = await this.conn.query(
      'SELECT Id, Name, CreatedDate, Status FROM UserLicense'
    )
    console.log(`debug userLicenses: ${JSON.stringify(userLicenses, null, 1)}`)

    const kind = 'salesforce.v1.userLicense'

    const userIds = userLicenses.records.map((license) => license.Id)
    const users: SalesforceUsers = await this.conn.query(
      `SELECT Id, Name,  UserRole.Id, UserRole.Name, Profile.Id, Profile.Name,Profile.UserLicense.Id, Profile.UserLicense.Name FROM User WHERE  Profile.UserLicense.Id IN ('${userIds.join(
        "','"
      )}')`
    )
    console.log(`debug users: ${JSON.stringify(users, null, 1)}`)

    const userMap = {}
    users.records.forEach((user) => {
      const licenseId = user.Profile?.UserLicense?.Id
      if (licenseId) {
        userMap[licenseId] = user.Profile.Id // Mapping UserLicenseId to Profile record
      }
    })
    const timestamp = new Date().toISOString()
    const resources: Resource[] = userLicenses.records.map((license) => ({
      id: license.Id,
      displayName: license.Name,
      kind,
      labels: {
        description: license.Name,
        timestamp,
        'salesforce/licenseStatus': license.Status,
        'salesforce/profileId': userMap[license.Id] || 'N/A',
      },
    })) as Resource[]
    console.log(`debug resources: ${JSON.stringify(resources, null, 1)}`)

    return {
      resources,
    }
  }

  async ApplyUpdate(req: ApplyUpdateRequest): Promise<ApplyUpdateResponse> {
    if (!this.conn) {
      this.ConnectSalesforce()
    }
    const auditEvent = req.events.find((e) => /grant|revoke/.test(e.event))
    const { event, resources } = auditEvent
    const grantee = getResourceByKind(resources, 'user')
    const granted = getResourceByKind(resources, 'salesforce.v1.userLicense')
    const grantedUserProfile = granted.labels['salesforce/profileId']

    const allUsers: SalesforceUsers = await this.conn.query(
      `SELECT Id, Name, UserRole.Id, UserRole.Name, Profile.Id, Profile.Name,Profile.UserLicense.Id, Profile.UserLicense.Name FROM User`
    )

    const user = allUsers.records.find((u) => u.Id === grantee.id)
    let res = { status: { code: StatusCode.UNKNOWN, message: '' } }

    try {
      if (event === 'access/grant') {
        const existingLicense = user.Profile.UserLicense.Id === granted.id
        if (!existingLicense) {
          const updateData = {
            Id: grantee.id,
            ProfileId: grantedUserProfile,
          }

          if (grantedUserProfile) {
            updateData.ProfileId = grantedUserProfile
          }

          await this.conn.sobject('User').update(updateData)
        }

        res.status.code = StatusCode.OK
      } else if (event === 'access/revoke') {
        const profilesWithoutLicense = allUsers.records.filter(
          (user) => !user.Profile.UserLicense.Id
        )
        await this.conn.sobject('User').update({
          Id: grantee.id,
          ProfileId: profilesWithoutLicense?.[0].Profile.Id || null,
        })
        res.status.code = StatusCode.OK
      }
    } catch (err) {
      res.status.code = StatusCode.INTERNAL
      res.status.message = err.message
      console.error('failed to update role and license')
      console.error(res.status.message)
    }
    return res
  }
}

function getResourceByKind(resources, kind) {
  return resources.find(
    (r) => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase())
  )
}
