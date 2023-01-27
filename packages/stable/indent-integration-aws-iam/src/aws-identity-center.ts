import { AssumeRoleCommand, STSClient } from '@aws-sdk/client-sts'
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

const version = require('../package.json').version

import {
  CreateGroupMembershipCommand,
  DeleteGroupMembershipCommand,
  GetUserIdCommand,
  IdentitystoreClient,
  IdentitystoreClientConfig,
  ListGroupsCommand,
} from '@aws-sdk/client-identitystore'
import { ListInstancesCommand, SSOAdminClient } from '@aws-sdk/client-sso-admin'

const kindIdentityUser = 'aws.identitystore.v1.User'
const kindIdentityGroup = 'aws.identitystore.v1.Group'

export class AWSIdentityCenterIntegration
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
      name: ['indent-aws-identity-center-webhook', this._name]
        .filter(Boolean)
        .join('#'),
      capabilities: ['ApplyUpdate', 'PullUpdate'],
      version,
    }
  }

  _idClient: IdentitystoreClient
  _ssoClient: SSOAdminClient

  private async GetClients(): Promise<[IdentitystoreClient, SSOAdminClient]> {
    if (this._idClient) return [this._idClient, this._ssoClient]

    const cfg: IdentitystoreClientConfig = { region: process.env.AWS_REGION }

    // Handle STS (assumed role)
    if (process.env.AWS_STS_ASSUME_ROLE) {
      const stsClient = new STSClient({ region: process.env.AWS_REGION })
      const cmd = new AssumeRoleCommand({
        RoleArn: process.env.AWS_STS_ASSUME_ROLE,
        RoleSessionName: `Indent-IdentityCenter-Manager`,
      })
      const result = await stsClient.send(cmd)
      cfg.credentials = {
        accessKeyId: result.Credentials.AccessKeyId,
        secretAccessKey: result.Credentials.SecretAccessKey,
        expiration: result.Credentials.Expiration,
        sessionToken: result.Credentials.SessionToken,
      }
    }

    this._idClient = new IdentitystoreClient(cfg)
    this._ssoClient = new SSOAdminClient(cfg)

    return [this._idClient, this._ssoClient]
  }

  MatchPull(req: PullUpdateRequest): boolean {
    return req.kinds.map((k) => k.toLowerCase()).includes(kindIdentityGroup)
  }

  async PullUpdate(req: PullUpdateRequest): Promise<PullUpdateResponse> {
    if (!this.MatchPull(req)) {
      return {
        status: {
          code: StatusCode.INVALID_ARGUMENT,
          details: {
            expectedKind: kindIdentityGroup,
            actualKinds: req.kinds,
          },
        },
      }
    }

    const [idstore, ssoadmin] = await this.GetClients()
    const listInstances = new ListInstancesCommand({ MaxResults: 5 })
    const { Instances } = await ssoadmin.send(listInstances)
    const listGroupItems = new ListGroupsCommand({
      IdentityStoreId: Instances[0].IdentityStoreId,
      MaxResults: 100,
    })
    const { Groups } = await idstore.send(listGroupItems)
    const timestamp = new Date().toISOString()

    return {
      status: { code: 0 },
      resources: Groups.map((g) => ({
        id: g.GroupId,
        kind: kindIdentityGroup,
        displayName: g.DisplayName,
        altIds: g.ExternalIds?.map((id) => `${id.Issuer}::${id.Id}`),
        labels: {
          'aws/id': g.GroupId,
          'aws/identityStoreId': g.IdentityStoreId,
          description: g.Description,
          timestamp,
        },
      })) as Resource[],
    }
  }

  MatchApply(req: WriteRequest): boolean {
    return (
      req.events.filter((e) =>
        Boolean(
          e.resources?.filter((r) =>
            r.kind?.toLowerCase().includes(kindIdentityGroup.toLowerCase())
          ).length
        )
      ).length > 0
    )
  }

  async ApplyUpdate(req: ApplyUpdateRequest): Promise<ApplyUpdateResponse> {
    const auditEvent = req.events.find((e) => /grant|revoke/.test(e.event))
    const { event, resources } = auditEvent
    const GroupId = getGroupFromResources(resources, 'group')
    const UserName = getUserNameFromResources(resources, 'user')
    const grantee = getUserFromResources(resources, 'user')

    let userId: string

    const [idstore, ssoadmin] = await this.GetClients()
    const listInstances = new ListInstancesCommand({ MaxResults: 5 })
    const { Instances } = await ssoadmin.send(listInstances)
    const IdentityStoreId = Instances[0].IdentityStoreId

    try {
      const out = await idstore.send(
        new GetUserIdCommand({
          IdentityStoreId,
          AlternateIdentifier: {
            UniqueAttribute: {
              AttributePath: 'email',
              AttributeValue: grantee.email,
            },
          },
        })
      )
      userId = out.UserId
    } catch (err) {
      // handle error
      console.error(
        `@indent/aws-iam-integration: ApplyUpdate: [ERR] GetUserCommand { UserName: ${UserName} }`
      )
      console.error(err)
    }

    if (!userId) {
      // Create user
      // const granteeUser = new CreateUserCommand({ UserName: grantee.email })
      // const newUser = await iamClient.send(granteeUser)
      // options.UserName = newUser.User.UserName
      // const newLogin = new CreateLoginProfileCommand({
      //   UserName: options.UserName,
      //   Password: DEFAULT_USER_PW,
      //   PasswordResetRequired: true,
      // })
      // await iamClient.send(newLogin)
      // console.error(
      //   `@indent/aws-iam-integration: ApplyUpdate: [OK] CreateUserCommand { UserName: ${UserName} }`
      // )
    }

    try {
      if (event === 'access/grant') {
        const cmd = new CreateGroupMembershipCommand({
          GroupId,
          IdentityStoreId,
          MemberId: {
            UserId: userId,
          },
        })
        await idstore.send(cmd)
      } else {
        const cmd = new DeleteGroupMembershipCommand({
          MembershipId: '123', // todo: lookup membership
          IdentityStoreId,
        })
        await idstore.send(cmd)
      }
      return { status: { code: 0 } }
    } catch (err) {
      console.error({ status: { code: 2, message: err.message } })
      console.error(err)
      return { status: { code: 2, message: err.message } }
    }
  }
}

const getUserFromResources = (
  resources: Resource[],
  kind: string
): Resource => {
  return resources.filter(
    (r) => r.kind && r.kind.toLowerCase().includes(kind.toLowerCase())
  )[0]
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
      return r.email
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
