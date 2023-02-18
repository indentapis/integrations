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
// import tailscale from '../lib/tailscale'

const { version } = require('../package.json')
const TAILSCALE_API_KEY = process.env.TAILSCALE_API_KEY
const TAILNET = process.env.TAILSCALE_TAILNET

// Optional arguments
const TAILSCALE_ALLOW_COMMENTS = process.env.TAILSCALE_ALLOW_COMMENTS

type JSONPatch = {
  op: string
  path: string
  value?: string
}

export class TailscaleGroupIntegration
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
      name: 'indent-integration-tailscale',
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
            r.kind?.toLowerCase().includes('tailscale.v1.group')
          ).length
        )
      ).length > 0
    )
  }

  FetchTailscale(
    config: AxiosRequestConfig<any>
  ): Promise<AxiosResponse<any, any>> {
    config.baseURL = `https://api.tailscale.com/api/v2`
    config.headers = TAILSCALE_ALLOW_COMMENTS
      ? {}
      : {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        }
    config.auth = {
      username: TAILSCALE_API_KEY,
      password: '',
    }

    config.responseType = TAILSCALE_ALLOW_COMMENTS ? 'text' : 'json'

    return this.Fetch(config)
  }

  async PullUpdate(_req: PullUpdateRequest): Promise<PullUpdateResponse> {
    const response = (await this.FetchTailscale({
      method: 'get',
      url: `/tailnet/${TAILNET}/acl`,
    }).then((r) => r.data)) as TailscaleACL

    const resources = Object.keys(response.groups).map(transformACL)

    return { resources }
  }

  async ApplyUpdate(req: ApplyUpdateRequest): Promise<ApplyUpdateResponse> {
    const auditEvent = req.events.find((e) => /grant|revoke/.test(e.event))
    const { event, resources } = auditEvent
    const { email } = getResourceByKind(resources, 'user')
    const { id } = getResourceByKind(resources, 'tailscale.v1.group')

    // get the tailscale acl from remote
    const resData = await this.FetchTailscale({
      method: 'get',
      url: `/tailnet/${TAILNET}/acl`,
    }).then((r) => r.data)

    let updateResponse: AxiosResponse

    if (TAILSCALE_ALLOW_COMMENTS) {
      /**
      try {
        // JWCC = JSON with comments and trailing comments
        const aclJWCC = resData as string
        const [json, err] = tailscale.ParseToJSON(aclJWCC)
        if (err) {
          throw err
        }

        const acl = JSON.parse(json)

        let patch: JSONPatch[]

        if (event === 'access/grant') {
          patch = [{ op: 'add', path: `/groups/${id}/0`, value: email }]
        } else {
          const index = acl.groups[id].findIndex((e: string) => e === email)
          if (index >= 0) {
            patch = [{ op: 'remove', path: `/groups/${id}/${index}` }]
          }
          // If the index is -1, the user already isn't a member of the group
        }
        if (patch && patch.length > 0) {
          const [data, err] = tailscale.Patch(aclJWCC, JSON.stringify(patch))
          if (err) {
            return {
              status: { code: StatusCode.UNKNOWN, details: err },
            }
          }
          updateResponse = await this.FetchTailscale({
            method: 'post',
            url: `/tailnet/${TAILNET}/acl`,
            data,
          })
          return { status: {} }
        } else {
          return {
            status: {
              code: 0,
              details: [
                {
                  '@type': 'type.googleapis.com/google.rpc.DebugInfo',
                  detail: 'no-op - user was not member of group',
                },
              ],
            },
          }
        }
      } catch (err) {
        console.error('Failed to apply update to Tailscale ACL')
        console.error(err)
        return { status: { code: StatusCode.UNKNOWN, message: err.toString() } }
      }
       */
    } else {
      // !!! Warning !!!
      // By using `application/json` updating ACLs will erase all the comments
      // and formatting of the ACL definition.

      const acl = resData as TailscaleACL
      // transform it
      let aclGroup = acl.groups[id]
      if (aclGroup) {
        aclGroup = aclGroup.filter((e: string) => e !== email)
        if (event === 'access/grant') {
          aclGroup.push(email)
        }
      } else {
        if (event === 'access/grant') {
          aclGroup = [email]
        }
      }
      acl.groups[id] = aclGroup
      updateResponse = await this.FetchTailscale({
        method: 'post',
        url: `/tailnet/${TAILNET}/acl`,
        data: JSON.stringify(acl, null, 2),
      })
    }

    if (updateResponse?.status > 201) {
      return {
        status: {
          code: StatusCode.UNKNOWN,
          details: { errorData: updateResponse?.data },
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

const transformACL = (aclEntry): Resource => {
  const kind = 'tailscale.v1.Group'
  const timestamp = new Date().toISOString()
  return {
    id: aclEntry,
    kind,
    displayName: aclEntry.split(':')[1],
    labels: {
      ['tailscale/tailnet']: TAILNET,
      timestamp,
    },
  }
}

interface TailscaleACL {
  groups: any
  hosts: any
  acls: any[]
  tests?: string[]
}
