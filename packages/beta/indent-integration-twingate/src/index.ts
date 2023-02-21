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
import { AxiosRequestConfig, AxiosResponse } from 'axios'

const { version } = require('../package.json')

const TWINGATE_API_KEY = process.env.TWINGATE_API_KEY
const NETWORK = process.env.TWINGATE_NETWORK

export const kindTwingateUser = 'twingate.v1.User'
export const kindTwingateGroup = 'twingate.v1.Group'

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

export const TWINGATE_GROUP_TYPE = 'MANUAL'
export const TWINGATE_QUERY_LIST_GROUPS = `
  query($filter: GroupFilterInput!) {
    groups(filter: $filter, first: 1000) {
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
    config.baseURL = `https://${NETWORK}.twingate.com/api/graphql/`
    config.headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-API-KEY': TWINGATE_API_KEY,
    }
    return this.Fetch(config)
  }

  async PullUpdate(_req: PullUpdateRequest): Promise<PullUpdateResponse> {
    const response = await this.FetchTwingate({
      method: 'POST',
      data: {
        query: TWINGATE_QUERY_LIST_GROUPS,
        variables: {
          filter: {
            type: {
              in: [TWINGATE_GROUP_TYPE],
            },
          },
        },
      },
    }).then((r) => r.data)

    const {
      data: {
        groups: { edges: groupEdges },
      },
      // TODO: paginate if needed
      pageInfo,
    } = response
    const groups = groupEdges.map((e) => e.node as TwingateGroup)
    const timestamp = new Date().toISOString()
    const resources: Resource[] = groups.map(
      (g) =>
        ({
          kind: kindTwingateGroup,
          id: Buffer.from(g.id, 'base64').toString('ascii'),
          displayName: g.name,
          labels: {
            timestamp,
            [`${kindTwingateGroup}/is_active`]: String(g.isActive),
            [`${kindTwingateGroup}/type`]: String(g.type),
          },
        } as Resource)
    )

    return { resources }
  }

  async ApplyUpdate(req: ApplyUpdateRequest): Promise<ApplyUpdateResponse> {
    const auditEvent = req.events.find((e) => /grant|revoke/.test(e.event))
    const { event, resources } = auditEvent
    const { email } = getResourceByKind(resources, 'user')
    const { id } = getResourceByKind(resources, kindTwingateGroup)

    // Get the Twingate user ID, assuming the first result always matches.
    // TODO See if this can be stored in indent.
    const userResponse = await this.FetchTwingate({
      method: 'POST',
      data: {
        query: TWINGATE_QUERY_GET_USER_BY_EMAIL,
        variables: {
          filter: { email: { eq: email } },
        },
      },
    }).then((r) => r.data)
    const user = userResponse.data?.users?.edges[0]?.node
    const key = event === 'access/grant' ? 'addedUserIds' : 'removedUserIds'

    const response = await this.FetchTwingate({
      method: 'POST',
      data: {
        query: TWINGATE_MUTATION_UPDATE_GROUP,
        variables: {
          id: Buffer.from(id, 'ascii').toString('base64'),
          [key]: [user?.id],
        },
      },
    })

    if (response.status > 204) {
      return {
        status: {
          code: StatusCode.UNKNOWN,
          details: { errorData: JSON.stringify(response.data) },
        },
      }
    }
    if (response.data?.errors) {
      return {
        status: {
          code: StatusCode.UNKNOWN,
          details: { errorData: JSON.stringify(response.data.errors) },
        },
      }
    }
    if (response.data?.data?.groupUpdate?.error) {
      return {
        status: {
          code: StatusCode.UNKNOWN,
          details: {
            errorData: JSON.stringify(response.data.data.groupUpdate.error),
          },
        },
      }
    }
    return { status: {} }
  }
}

const getResourceByKind = (resources: Resource[], kind: string): Resource =>
  resources.filter(
    (r) => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase())
  )[0]
