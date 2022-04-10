import {
  BaseHttpIntegration,
  HealthCheckResponse,
  IntegrationInfoResponse,
  PullIntegration,
  PullUpdateRequest,
  StatusCode,
} from '@indent/base-integration'
import { PullUpdateResponse, Resource } from '@indent/types'
import { callOktaAPI } from './okta-api'

const version = require('../package.json').version
const OKTA_DOMAIN = process.env.OKTA_DOMAIN || ''

// Okta Slack App ID - used to more accurately link okta users to slack users
const APP_ID = process.env.OKTA_SLACK_APP_ID || ''

export class OktaUserIntegration
  extends BaseHttpIntegration
  implements PullIntegration
{
  GetInfo(): IntegrationInfoResponse {
    return {
      version,
      name: 'indent-okta-users-webhook',
      capabilities: ['PullUpdate'],
    }
  }

  HealthCheck(): HealthCheckResponse {
    return { status: {} }
  }

  MatchPull(req: PullUpdateRequest): boolean {
    return req.kinds.map((k) => k.toLowerCase()).includes('okta.v1.user')
  }

  async PullUpdate(req: PullUpdateRequest): Promise<PullUpdateResponse> {
    if (!this.MatchPull(req)) {
      return {
        status: {
          code: StatusCode.INVALID_ARGUMENT,
          details: [
            {
              '@type': 'type.googleapis.com/google.rpc.DebugInfo',
              detail: `expected = okta.v1.user (lowercase), got = ${req.kinds.join(
                ', '
              )}`,
            },
          ],
        },
      }
    }

    const timestamp = new Date().toISOString()
    const {
      status,
      response: { data: oktaUserResources },
    } = await callOktaAPI(this, {
      url: '/api/v1/users',
      transform: (user) => ({
        id: [OKTA_DOMAIN, user.id].join('/users/'),
        kind: 'okta.v1.User',
        email: user.profile.email,
        displayName: [user.profile.firstName, user.profile.lastName]
          .filter(Boolean)
          .join(' '),
        labels: {
          oktaId: user.id,
          managerId: user.profile.managerId || '',
          timestamp,
        },
      }),
    })
    const oktaUserMapById = oktaUserResources.reduce(
      (acc, r) => ({
        ...acc,
        [r.labels.oktaId]: r,
        [r.email]: r,
      }),
      {}
    )
    oktaUserResources.forEach((user) => {
      // check if managerId is an email, then update to okta id for uniqueness
      if (user.labels.managerId && user.labels.managerId.includes('@')) {
        if (oktaUserMapById[user.labels.managerId]) {
          user.labels.managerId =
            oktaUserMapById[user.labels.managerId].labels.oktaId
        }
      }
    })
    const {
      response: { data: appUserResources },
    } = !APP_ID
      ? { response: { data: [] } }
      : await callOktaAPI(this, {
          url: `/api/v1/apps/${APP_ID}/users`,
          transform: (appuser) => ({
            id: [OKTA_DOMAIN, appuser.id].join(`/api/v1/apps/${APP_ID}/users/`),
            kind: 'okta.v1.AppUser',
            email: appuser.profile.email,
            displayName: [appuser.profile.firstName, appuser.profile.lastName]
              .filter(Boolean)
              .join(' '),
            labels: {
              oktaAppId: APP_ID,
              oktaId: appuser.id,
              slackId: appuser.externalId,
              managerId: oktaUserMapById[appuser.id]
                ? oktaUserMapById[appuser.id].labels.managerId
                : '',
              slackUsername: appuser.profile.slackUsername,
              timestamp,
            },
          }),
        })
    const slackUserResources = (
      appUserResources.length > 0 ? appUserResources : oktaUserResources
    ).map((r) =>
      pick({
        // Due to missing slack app ID this pull webhook resolves based on email
        id: r.labels.slackId || '',
        displayName: r.displayName,
        kind: 'slack/user',
        email: r.email,
        labels: {
          oktaId: r.labels.oktaId,
          managerId: r.labels.managerId,
          timestamp,
        },
      } as Resource)
    )

    let resources = [
      ...oktaUserResources,
      ...appUserResources,
      ...slackUserResources,
    ]

    console.log({
      resources,
    })

    return { status, resources }
  }
}

const pick = (obj: any) =>
  Object.keys(obj).reduce(
    (acc, key) => ({
      ...acc,
      ...(typeof obj[key] !== 'undefined' && obj[key]
        ? { [key]: obj[key] }
        : {}),
    }),
    {}
  )
