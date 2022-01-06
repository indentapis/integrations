import {
  ApplyIntegration,
  ApplyUpdateRequest,
  BaseHttpIntegration,
  BaseHttpIntegrationOpts,
  HealthCheckResponse,
  IntegrationInfoResponse,
  StatusCode,
  WriteRequest,
} from '@indent/base-webhook'
import { ApplyUpdateResponse, Resource } from '@indent/types'
import { AxiosRequestConfig, AxiosResponse } from 'axios'
import { getToken } from './okta-auth'

const version = require('../package.json').version
const OKTA_DOMAIN = process.env.OKTA_DOMAIN || ''
const OKTA_PROFILE_RESOURCE_KIND =
  process.env.OKTA_PROFILE_RESOURCE_KIND || 'ProfileAttribute'
const OKTA_PROFILE_ATTRIBUTE =
  process.env.OKTA_PROFILE_ATTRIBUTE || 'okta/userProfileAttribute/id'
const OKTA_PROFILE_ATTRIBUTE_VALUE =
  process.env.OKTA_PROFILE_ATTRIBUTE_VALUE || 'okta/userProfileAttribute/value'

export class OktaProfileIntegration
  extends BaseHttpIntegration
  implements ApplyIntegration
{
  _name?: string

  constructor(opts?: BaseHttpIntegrationOpts) {
    super(opts)
  }

  HealthCheck(): HealthCheckResponse {
    return { status: { code: 0 } }
  }

  GetInfo(): IntegrationInfoResponse {
    return {
      name: ['indent-okta-profile-webhook', this._name]
        .filter(Boolean)
        .join('#'),
      capabilities: ['ApplyUpdate'],
      version,
    }
  }

  async FetchOkta(
    config: AxiosRequestConfig<any>
  ): Promise<AxiosResponse<any, any>> {
    const { Authorization } = await getToken()
    config.baseURL = `https://${OKTA_DOMAIN}/api/v1`
    config.headers = {
      Authorization,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }

    return this.Fetch(config)
  }

  MatchApply(req: WriteRequest): boolean {
    return (
      req.events.filter((e) =>
        Boolean(
          e.resources?.filter((r) =>
            r.kind
              ?.toLowerCase()
              .includes(OKTA_PROFILE_RESOURCE_KIND.toLowerCase())
          ).length
        )
      ).length > 0
    )
  }

  async ApplyUpdate(req: ApplyUpdateRequest): Promise<ApplyUpdateResponse> {
    const auditEvent = req.events.find((e) => /grant|revoke/.test(e.event))
    const { event, resources } = auditEvent
    const oktaUser = getResourceByKind(resources, 'user')
    const attributeResource = getResourceByKind(
      resources,
      OKTA_PROFILE_RESOURCE_KIND
    )

    if (event) {
      const oktaUserId = oktaUser.labels['oktaId'] || oktaUser.id
      const user = await this.FetchOkta({
        method: 'get',
        url: `/users/${oktaUserId}`,
      }).then((r) => r.data)

      const attributeKey = attributeResource?.labels?.[OKTA_PROFILE_ATTRIBUTE]
      const attributeValue =
        attributeResource?.labels?.[OKTA_PROFILE_ATTRIBUTE_VALUE] ||
        attributeResource.id
      const updatedUser = { profile: {} }

      if (user.profile) {
        let currAttributeValue = user.profile[attributeKey].filter(
          (k) => k !== attributeValue
        )
        if (event === 'access/grant') {
          currAttributeValue.push(attributeValue)
        } else {
          currAttributeValue = [attributeValue]
        }

        updatedUser.profile[attributeKey] = currAttributeValue
      }

      const response = await this.FetchOkta({
        method: 'post',
        url: `/users/${oktaUserId}`,
        data: updatedUser,
      })

      if (response.status > 201) {
        return {
          status: {
            code: StatusCode.UNKNOWN,
            details: { errorData: response.data },
          },
        }
      }

      return { status: {} }
    }
  }
}

const getResourceByKind = (resources: Resource[], kind: string): Resource => {
  return resources.filter(
    (r) => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase())
  )[0]
}
