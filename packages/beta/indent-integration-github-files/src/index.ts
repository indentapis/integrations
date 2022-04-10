import {
  ApplyIntegration,
  ApplyUpdateRequest,
  BaseHttpIntegration,
  BaseHttpIntegrationOpts,
  HealthCheckResponse,
  IntegrationInfoResponse,
  StatusCode,
} from '@indent/base-integration'
import { ApplyUpdateResponse, Resource } from '@indent/types'
import { getAndUpdateACL } from './github-api'

const version = require('../package.json').version

export class GitHubFilesIntegration
  extends BaseHttpIntegration
  implements ApplyIntegration
{
  _name?: string

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
      name: ['indent-github-files-webhook', this._name]
        .filter(Boolean)
        .join('#'),
      capabilities: ['ApplyUpdate', 'PullUpdate'],
      version,
    }
  }

  MatchApply(_req: ApplyUpdateRequest): boolean {
    return true
  }

  async ApplyUpdate(req: ApplyUpdateRequest): Promise<ApplyUpdateResponse> {
    const requestEvent = req.events.filter(
      (e) => e.event === 'access/request'
    )[0]
    const auditEvent = req.events.find((e) => /grant|revoke/.test(e.event))
    const { resources } = auditEvent
    const recipient = getResourceByKind(resources, 'user')
    const granted = getResourceByKind(resources, 'role')
    const { labels } = granted
    const { githubRepo, githubPath, githubManagedLabel } = labels
    const resolvedLabel = labels[githubManagedLabel || 'role']

    try {
      const { updateResult, sourceACL, updatedACL } = await getAndUpdateACL(
        { githubRepo, path: githubPath, resolvedLabel },
        (aclText: string) => {
          const aclByLine = aclText.split('\n')
          const aclPrefix = getIndentationPrefix(aclByLine[0])
          const entries = aclByLine.filter(
            (a) => !a.includes('//indent:managed')
          )
          const newEntries = entries.filter((e) => !e.includes(recipient.email))
          let reqReason = requestEvent.reason || ''

          if (reqReason) {
            reqReason = ` // ${reqReason}`
          }

          newEntries.push(aclPrefix + `"${recipient.email}",${reqReason}`)

          return [
            aclByLine[0],
            ...newEntries,
            aclByLine[aclByLine.length - 1],
          ].join('\n')
        }
      )

      console.log({
        updateResult,
        sourceACL,
        updatedACL,
      })
      return {
        status: {
          code: StatusCode.OK,
        },
      }
    } catch (err) {
      return {
        status: {
          code: StatusCode.UNKNOWN,
          message: err.message,
          details: err.stack,
        },
      }
    }
  }
}

function getResourceByKind(resources: Resource[], kind: string): Resource {
  return resources.filter(
    (r) => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase())
  )[0]
}

function getIndentationPrefix(str: string) {
  return str.match(/^[\s\uFEFF\xA0]+/g)
}
