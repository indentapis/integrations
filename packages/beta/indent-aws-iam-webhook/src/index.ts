import { IAMClient } from '@aws-sdk/client-iam'
import {
  BaseHttpIntegration,
  BaseHttpIntegrationOpts,
  FullIntegration,
  HealthCheckResponse,
  IntegrationInfoResponse,
  WriteRequest,
} from '@indent/base-webhook'
import { PullUpdateResponse } from '@indent/types'

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

  FetchAwsIamGroups() {}

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

  async PullUpdate(req: PullUpdateRequest): Promise<PullUpdateResponse> {}
  async ApplyUpdate(_req: WriteRequest): Promise<ApplyUpdateResponse> {}
}
