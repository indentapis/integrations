import {
  ApplyUpdateRequest,
  BaseHttpIntegration,
  BaseHttpIntegrationOpts,
  FullIntegration,
  HealthCheckResponse,
  IntegrationInfoResponse,
  PullUpdateRequest,
  WriteRequest,
} from '@indent/base-integration'
import {
  ApplyUpdateResponse,
  PullUpdateResponse,
  Resource,
} from '@indent/types'
import { AxiosRequestConfig, AxiosResponse } from 'axios'

const { version } = require('../package.json')
const TWINGATE_API_KEY = process.env.TWINGATE_API_KEY
const NETWORK = process.env.TWINGATE_NETWORK

type TwingateUser = {
  id: string
  email: string
  lastName: string
  firstName: string
  groups: { id: string }[]
}
type TwingateGroup = {
  id: string
  name: string
  type: string
  isActive: boolean
  users: { id: string }[]
}
type TwingatePullResponse = {
  users: TwingateUser[]
  groups: TwingateGroup[]
}

export class TwingateGroupIntegration
  extends BaseHttpIntegration
  implements FullIntegration
{
  _name?: string

  constructor(opts?: BaseHttpIntegrationOpts) {
    super(opts)
  }

  GetInfo(): IntegrationInfoResponse {
    return {
      version,
      name: 'indent-integration-twingate',
      capabilities: ['ApplyUpdate', 'PullUpdate'],
    }
  }

  HealthCheck(): HealthCheckResponse {
    return { status: {} }
  }

  MatchApply(req: WriteRequest): boolean {
    return (
      req.events.filter((e) =>
        Boolean(
          e.resources?.filter((r) =>
            r.kind?.toLowerCase().includes('twingate.v1.group')
          ).length
        )
      ).length > 0
    )
  }

  FetchTwingate(
    config: AxiosRequestConfig<any>
  ): Promise<AxiosResponse<any, any>> {
    config.baseURL = `https://${NETWORK}.twingate.com/api/graphql`
    config.headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }
    config.headers = { 'X-API-KEY': TWINGATE_API_KEY }
    return this.Fetch(config)
  }

  async PullUpdate(_req: PullUpdateRequest): Promise<PullUpdateResponse> {
    const response = (await this.FetchTwingate({
      method: 'post',
      data: {
        query: `
      fragment fields on User {
        id
        firstName
        lastName
        email
        groups {
          edges {
            node {
              id
            }
          }
        }
      }
      
      {
        users(after: null, first: 1000) {
          edges {
            node {
              ...fields
            }
          }
        }
        groups {
          edges {
            node {
              id
              name
              type
              isActive
              users {
                edges {
                  node {
                    id
                  }
                }
              }
            }
          }
        }
        groups {
          edges {
            node {
              id
              name
              type
              isActive
              users {
                edges {
                  node {
                    id
                  }
                }
              }
            }
          }
        }
      }`,
      },
    }).then((r) => r.data)) as TwingatePullResponse

    const { users, groups } = response
    const timestamp = new Date().toISOString()
    const resources: Resource[] = [
      ...users.map(
        (u) =>
          ({
            kind: 'twingate.v1.User',
            id: u.id,
            email: u.email,
            displayName: [u.firstName, u.lastName].join(' '),
            labels: { timestamp },
          } as Resource)
      ),
      ...groups.map(
        (g) =>
          ({
            kind: 'twingate.v1.Group',
            id: g.id,
            displayName: g.name,
            labels: {
              timestamp,
              'twingate.v1.Group/is_active': String(g.isActive),
              'twingate.v1.Group/type': String(g.type),
            },
          } as Resource)
      ),
    ]

    return { resources }
  }

  async ApplyUpdate(_req: ApplyUpdateRequest): Promise<ApplyUpdateResponse> {
    // async ApplyUpdate(req: ApplyUpdateRequest): Promise<ApplyUpdateResponse> {
    // const auditEvent = req.events.find((e) => /grant|revoke/.test(e.event))
    // const { event, resources } = auditEvent
    // const { email } = getResourceByKind(resources, 'user')
    // const { id } = getResourceByKind(resources, 'twingate.v1.group')

    // // get the twingate acl from remote
    // const response = (await this.FetchTwingate({
    //   method: 'get',
    //   url: `/network/${NETWORK}/acl`,
    // }).then((r) => r.data)) as TwingateACL
    // // transform it
    // let aclGroup = response.groups[id]
    // if (aclGroup) {
    //   aclGroup = aclGroup.filter((e: string) => e !== email)
    //   if (event === 'access/grant') {
    //     aclGroup.push(email)
    //   }
    // } else {
    //   if (event === 'access/grant') {
    //     aclGroup = [email]
    //   }
    // }
    // response.groups[id] = aclGroup

    // const updateResponse = await this.FetchTwingate({
    //   method: 'post',
    //   url: `/network/${NETWORK}/acl`,
    //   data: JSON.stringify(response, null, 2),
    // })

    // if (updateResponse.status > 201) {
    //   return {
    //     status: {
    //       code: StatusCode.UNKNOWN,
    //       details: { errorData: updateResponse.data },
    //     },
    //   }
    // }

    return { status: {} }
  }
}

const _getResourceByKind = (resources: Resource[], kind: string): Resource =>
  resources.filter(
    (r) => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase())
  )[0]
