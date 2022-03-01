import {
  AddUserToGroupCommand,
  IAMClient,
  ListGroupsCommand,
  RemoveUserFromGroupCommand,
} from '@aws-sdk/client-iam'
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
} from '@indent/base-webhook'
import {
  ApplyUpdateResponse,
  PullUpdateResponse,
  Resource,
} from '@indent/types'
import { AxiosRequestConfig, AxiosResponse } from 'axios'

const version = require('../package.json').version

const iamClient = new IAMClient({ region: `${process.env.AWS_REGION}` })

export class awsIamIntegration
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
      name: ['indent-aws-iam-webhook', this._name].filter(Boolean).join('#'),
      capabilities: ['ApplyUpdate', 'PullUpdate'],
      version,
    }
  }

  FetchAwsIamGroups(
    config: AxiosRequestConfig<any>
  ): Promise<AxiosResponse<any, any>> {
    return this.Fetch(config)
  }

  MatchApply(req: WriteRequest): boolean {
    return (
      req.events.filter((e) =>
        Boolean(
          e.resources?.filter((r) =>
            r.kind?.toLowerCase().includes('aws.iam.v1.group')
          ).length
        )
      ).length > 0
    )
  }

  MatchPull(req: PullUpdateRequest): boolean {
    return req.kinds.map((k) => k.toLowerCase()).includes('aws.iam.v1.group')
  }

  async PullUpdate(req: PullUpdateRequest): Promise<PullUpdateResponse> {
    if (!this.MatchPull(req)) {
      return {
        status: {
          code: StatusCode.INVALID_ARGUMENT,
          details: {
            expectedKindLower: 'aws.iam.v1.group',
            actualKinds: req.kinds,
          },
        },
      }
    }

    const listGroupItems = new ListGroupsCommand({ MaxItems: 100 })
    const response = await iamClient.send(listGroupItems)
    const { Groups } = response
    const timestamp = new Date().toISOString()
    const kind = 'aws.iam.v1.group'

    return {
      resources: Groups.map((g) => ({
        id: g.Arn.toString(),
        kind,
        displayName: g.GroupName,
        labels: {
          'aws/arn': g.Arn,
          'aws/createDate': g.CreateDate.toString(),
          'aws/path': g.Path,
          timestamp,
        },
      })) as Resource[],
    }
  }

  async ApplyUpdate(req: ApplyUpdateRequest): Promise<ApplyUpdateResponse> {
    const auditEvent = req.events.find((e) => /grant|revoke/.test(e.event))
    const { event, resources } = auditEvent
    const user = getUserNameFromResources(resources, 'user')
    const group = getGroupFromResources(resources, 'group')
    const options = { GroupName: group, UserName: user }
    const method =
      event === 'access/grant'
        ? new AddUserToGroupCommand(options)
        : new RemoveUserFromGroupCommand(options)

    try {
      await iamClient.send(method)
      return { status: { code: 0 } }
    } catch (err) {
      console.error({
        status: { code: 2, message: err.message, details: err.stack },
      })
      return { status: { code: 2, message: err.message, details: err.stack } }
    }
  }
}

const getUserNameFromResources = (
  resources: Resource[],
  kind: string
): string => {
  return resources
    .filter((r) => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase()))
    .map((r) => {
      if (r.labels && r.labels['aws/username']) {
        return r.labels['aws/username']
      }

      return r.displayName
    })[0]
}

const getGroupFromResources = (resources: Resource[], kind: string): string => {
  return resources
    .filter((r) => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase()))
    .map((r) => {
      if (r.labels && r.labels['aws/group']) {
        return r.labels['aws/group']
      }

      return r.displayName
    })[0]
}
