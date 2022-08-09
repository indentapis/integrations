import {
  BaseHttpIntegration,
  BaseHttpIntegrationOpts,
  HealthCheckResponse,
  IntegrationInfoResponse,
  PullIntegration,
  PullUpdateRequest,
  StatusCode,
  WriteRequest,
} from '@indent/base-integration'
import { PullUpdateResponse } from '@indent/types'
import { callOktaAPI } from './okta-api'

const version = require('../package.json').version
const OKTA_DOMAIN = process.env.OKTA_DOMAIN || ''

export class OktaAppIntegration
  extends BaseHttpIntegration
  implements PullIntegration
{
  _name?: string

  constructor(opts?: BaseHttpIntegrationOpts) {
    super(opts)
    if (opts) {
      this._name = opts.name
    }
  }

  GetInfo(): IntegrationInfoResponse {
    return {
      version,
      name: 'indent-okta-apps-webhook',
      capabilities: ['PullUpdate'],
    }
  }

  HealthCheck(): HealthCheckResponse {
    return { status: { code: 0 } }
  }

  MatchApply(req: WriteRequest): boolean {
    return (
      req.events.filter((e) =>
        Boolean(
          e.resources?.filter((r) =>
            r.kind?.toLowerCase().includes('okta.v1.app')
          ).length
        )
      ).length > 0
    )
  }

  MatchPull(req: PullUpdateRequest): boolean {
    return req.kinds.map((k) => k.toLowerCase()).includes('okta.v1.app')
  }

  async PullUpdate(req: PullUpdateRequest): Promise<PullUpdateResponse> {
    if (!this.MatchPull(req)) {
      return {
        status: {
          code: StatusCode.INVALID_ARGUMENT,
          details: [
            { expectedKindLower: 'okta.v1.app', actualKinds: req.kinds },
          ],
        },
      }
    }

    const { status, response } = await callOktaAPI(this, {
      method: 'GET',
      url: '/api/v1/apps',
      scope: 'okta.apps.read',
    })

    const timestamp = new Date().toISOString()
    const resources = response.data.map((app) =>
      pick({
        // FIXME: map the fields of the app
        // https://developer.okta.com/docs/reference/api/apps/#list-applications-with-defaults
        // Add fields:
        // - name
        // - _links.logo (as label `indent.com/profile/avatar` double-check in dashboard)
        //
        //
        // id: [OKTA_DOMAIN, app.id].join('/api/v1/apps/'),
        // kind: 'okta.v1.App',
        // displayName: app.name,
        // labels: {
        //   oktaId: app.id,
        //   description: app.profile?.description || '',
        //   oktaAppType: app.type,
        //   timestamp,
        // },
      })
    )

    console.log('@indent/integration-okta: pulled apps')
    console.log({ resources })

    return { status, resources }
  }
}

const pick = (obj: any) =>
  Object.keys(obj).reduce(
    (acc, key) => ({
      ...acc,
      ...(typeof obj[key] !== 'undefined' ? { [key]: obj[key] } : {}),
    }),
    {}
  )
