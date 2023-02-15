import {
  ApplyUpdateRequest,
  BaseHttpIntegration,
  BaseHttpIntegrationOpts,
  FullIntegration,
  HealthCheckResponse,
  IntegrationInfoResponse,
  PullUpdateRequest,
  StatusCode,
} from '@indent/base-integration'
import {
  ApplyUpdateResponse,
  PullUpdateResponse,
  Resource,
} from '@indent/types'
import { AxiosRequestConfig, AxiosResponse } from 'axios'

const pkg = require('../package.json')

const { TWINGATE_API_KEY, TWINGATE_TENANT_NAME } = process.env

const TWINGATE_API_BASE_URL = `https://${TWINGATE_TENANT_NAME}.twingate.com`
const TWINGATE_GROUP_TYPE = 'MANUAL'
const TWINGATE_KIND_GROUP = 'twingate.v1.group'

const TWINGATE_QUERY_LIST_GROUPS = `
  query($filter: GroupFilterInput!) {
    groups(filter: $filter) {
      edges {
        node {
          id
          name
          createdAt
          updatedAt
          isActive
          type
        }
      }
      pageInfo {
        startCursor
        hasNextPage
      }
    }
  }
`

const TWINGATE_QUERY_GET_USER_BY_EMAIL = `
  query getUser($filter: UserFilterInput!){
    users(filter: $filter) {
        edges {
          node{
            id
            firstName
            lastName
            email
            createdAt
            updatedAt
            isAdmin
            state
          }
        }
      }
    }
`

const TWINGATE_MUTATION_UPDATE_GROUP = `
  mutation(id: ID!, addedUserIds: [ID], removedUserIds: [ID]){
    groupUpdate(id: $id, addedUserIds: $addedUserIds, removedUserIds: $removedUserIds) {
      ok
      error
    }
  }
`

export class TwingateIntegration
  extends BaseHttpIntegration
  implements FullIntegration
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
      name: ['indent-twingate', this._name].filter(Boolean).join('#'),
      capabilities: ['ApplyUpdate', 'PullUpdate'],
      version: pkg.version,
    }
  }

  FetchTwingate(
    config: AxiosRequestConfig<any>
  ): Promise<AxiosResponse<any, any>> {
    config.baseURL = TWINGATE_API_BASE_URL
    config.headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Api-Key': TWINGATE_API_KEY,
    }

    config.responseType = 'json'

    return this.Fetch(config)
  }

  MatchPull(req: PullUpdateRequest): boolean {
    return req.kinds.map((k) => k.toLowerCase()).includes(TWINGATE_KIND_GROUP)
  }

  async PullUpdate(_req: PullUpdateRequest): Promise<PullUpdateResponse> {
    const response = await this.FetchTwingate({
      method: 'POST',
      url: '/api/graphql/',
      data: JSON.stringify({
        query: TWINGATE_QUERY_LIST_GROUPS,
        variables: {
          filter: {
            type: {
              in: [TWINGATE_GROUP_TYPE],
            },
          },
        },
      }),
    })
    console.log(response.data)

    const groups = response.data.data.groups.edges.map((e) => e.node)
    const timestamp = new Date().toISOString()

    const resources = groups.map((g) => ({
      id: g.id.toString(),
      kind: TWINGATE_KIND_GROUP,
      displayName: g.name,
      labels: {
        'twingate/tenant': TWINGATE_TENANT_NAME,
        'twingate/id': g.id.toString(),
        timestamp,
      },
    })) as Resource[]

    return {
      resources,
    }
  }

  async ApplyUpdate(req: ApplyUpdateRequest): Promise<ApplyUpdateResponse> {
    const { events } = req

    const results = await Promise.all(
      events.map(async (auditEvent) => {
        const { event, resources } = auditEvent
        const { email } = getResourceByKind(resources, 'user')
        const { id } = getResourceByKind(resources, TWINGATE_KIND_GROUP)

        // Get the Twingate user ID, assuming the first result always matches.
        // TODO See if this can be stored in indent.
        const userResponse = await this.FetchTwingate({
          method: 'POST',
          url: '/api/graphql',
          data: {
            query: TWINGATE_QUERY_GET_USER_BY_EMAIL,
            variables: {
              filter: { email: { eq: email } },
            },
          },
        })
        const user = userResponse.data.users.edges[0]?.node

        const key = event === 'access/grant' ? 'addedUserIds' : 'removedUserIds'

        const response = await this.FetchTwingate({
          method: 'POST',
          url: '/api/graphql',
          data: {
            query: TWINGATE_MUTATION_UPDATE_GROUP,
            variables: {
              id,
              [key]: [user.id],
            },
          },
        })
        if (response.status > 204) {
          return {
            status: {
              code: StatusCode.UNKNOWN,
              details: { errorData: response.data },
            },
          }
        }
        if (response.data.errors) {
          return {
            status: {
              code: StatusCode.UNKNOWN,
              details: { errorData: response.data.errors },
            },
          }
        }
        if (response.data.groupUpdate.error) {
          return {
            status: {
              code: StatusCode.UNKNOWN,
              details: { errorData: response.data.data.groupUpdate.error },
            },
          }
        }
      })
    )

    return {
      status: { code: 0, details: [{ debugOutcome: 'success', results }] },
    }
  }
}

const getResourceByKind = (resources: Resource[], kind: string): Resource =>
  resources.filter(
    (r) => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase())
  )[0]
