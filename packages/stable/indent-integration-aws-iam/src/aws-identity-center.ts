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
  CreateUserCommand,
  DeleteGroupMembershipCommand,
  GetUserIdCommand,
  IdentitystoreClient,
  IdentitystoreClientConfig,
  ListGroupMembershipsCommand,
  ListGroupsCommand,
} from '@aws-sdk/client-identitystore'
import {
  Account,
  ListAccountsCommand,
  OrganizationsClient,
} from '@aws-sdk/client-organizations'
import {
  CreateAccountAssignmentCommand,
  DeleteAccountAssignmentCommand,
  DescribePermissionSetCommand,
  ListInstancesCommand,
  ListPermissionSetsCommand,
  SSOAdminClient,
} from '@aws-sdk/client-sso-admin'

const kindIdentityUser = 'aws.identitystore.v1.User'
const kindIdentityGroup = 'aws.identitystore.v1.Group'
const kindIdentityAccountRole = 'aws.v1beta1.AccountRole'

const INDENT_AWS_DIRECT_ASSIGNMENT =
  process.env.INDENT_AWS_DIRECT_ASSIGNMENT || ''

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
  _orgClient: OrganizationsClient

  private async GetClients(): Promise<
    [IdentitystoreClient, SSOAdminClient, OrganizationsClient]
  > {
    if (this._idClient) {
      return [this._idClient, this._ssoClient, this._orgClient]
    }

    const region = process.env.AWS_IDENTITY_REGION || process.env.AWS_REGION
    const cfg: IdentitystoreClientConfig = { region }

    // Handle STS (assumed role)
    if (process.env.AWS_STS_ASSUME_ROLE) {
      const stsClient = new STSClient({ region })
      const cmd = new AssumeRoleCommand({
        RoleArn: process.env.AWS_STS_ASSUME_ROLE,
        ExternalId: process.env.AWS_STS_EXTERNAL_ID,
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
    this._orgClient = new OrganizationsClient(cfg)

    return [this._idClient, this._ssoClient, this._orgClient]
  }

  MatchPull(req: PullUpdateRequest): boolean {
    const kinds = req.kinds.map((k) => k.toLowerCase())

    return (
      kinds.includes(kindIdentityGroup.toLowerCase()) ||
      kinds.includes(kindIdentityAccountRole.toLowerCase())
    )
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

    const [idstore, ssoadmin, orgClient] = await this.GetClients()
    const listInstances = new ListInstancesCommand({ MaxResults: 5 })
    const { Instances } = await ssoadmin.send(listInstances)
    const { IdentityStoreId, InstanceArn } = Instances[0]
    const listGroupItems = new ListGroupsCommand({
      IdentityStoreId,
      MaxResults: 100,
    })
    const { Groups } = await idstore.send(listGroupItems)
    const timestamp = new Date().toISOString()

    const resources = Groups.map((g) => ({
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
    })) as Resource[]

    if (INDENT_AWS_DIRECT_ASSIGNMENT) {
      let Accounts: Account[] = []
      let NextToken: string = ''

      while (Accounts.length === 0 || NextToken) {
        const { Accounts: _accounts, NextToken: _nextToken } =
          await orgClient.send(
            new ListAccountsCommand({
              MaxResults: 20,
              NextToken,
            })
          )
        Accounts.push(..._accounts)
        NextToken = _nextToken
      }

      const { PermissionSets } = await ssoadmin.send(
        new ListPermissionSetsCommand({
          InstanceArn,
          MaxResults: 100,
        })
      )

      const perms = await Promise.all(
        PermissionSets.map((parm) =>
          ssoadmin.send(
            new DescribePermissionSetCommand({
              InstanceArn,
              PermissionSetArn: parm,
            })
          )
        )
      )

      Accounts.forEach((account) => {
        perms.forEach((perm) => {
          resources.push({
            id: [InstanceArn, account.Id, perm.PermissionSet.Name].join('/'),
            kind: kindIdentityAccountRole,
            displayName: `${account.Name} - ${perm.PermissionSet.Name}`,
            labels: {
              'aws/accountId': account.Id,
              'aws/accountArn': account.Arn,
              'aws/permissionName': perm.PermissionSet.Name,
              'aws/permissionArn': perm.PermissionSet.PermissionSetArn,
              'aws/instanceArn': InstanceArn,
              'aws/identityStoreId': IdentityStoreId,
              description: perm.PermissionSet.Description,
              timestamp,
            },
          })
        })
      })
    }

    return {
      status: { code: 0 },
      resources,
    }
  }

  MatchApply(req: WriteRequest): boolean {
    return (
      req.events.filter((e) =>
        Boolean(
          e.resources?.filter(
            (r) =>
              r.kind?.toLowerCase().includes(kindIdentityGroup.toLowerCase()) ||
              r.kind
                ?.toLowerCase()
                .includes(kindIdentityAccountRole.toLowerCase())
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
    const granted = resources.find((r) =>
      /group|account/.test(r.kind.toLowerCase())
    )

    let awsUserId: string

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
              AttributePath: 'UserName',
              AttributeValue: grantee.email,
            },
          },
        })
      )
      awsUserId = out.UserId
      console.log(
        `@indent/aws-iam-integration: ApplyUpdate: [OK] GetUserIdCommand { UserName: ${grantee.email}, UserId: ${awsUserId} }`
      )
    } catch (err) {
      // handle error
      console.error(
        `@indent/aws-iam-integration: ApplyUpdate: [ERR] GetUserCommand { UserName: ${UserName} }`
      )
      console.error(err)
    }

    if (!awsUserId) {
      // Create user
      const granteeUser = new CreateUserCommand({
        IdentityStoreId,
        DisplayName: grantee.displayName,
        UserName: grantee.email,
        Emails: [
          {
            Type: 'work',
            Primary: true,
            Value: grantee.email,
          },
        ],
      })

      // TODO: implement new user creation
      //
      // const newUser = await idstore.send(granteeUser)
      // options.UserName = newUser.User.UserName
      // const newLogin = new CreateLoginProfileCommand({
      //   UserName: options.UserName,
      //   Password: DEFAULT_USER_PW,
      //   PasswordResetRequired: true,
      // })
      // await iamClient.send(newLogin)

      console.error(
        `@indent/aws-iam-integration: ApplyUpdate: [OK] CreateUserCommand { UserName: ${granteeUser.input.UserName} }`
      )
    }

    try {
      if (event === 'access/grant') {
        if (granted.kind === kindIdentityGroup) {
          await idstore.send(
            new CreateGroupMembershipCommand({
              GroupId,
              IdentityStoreId,
              MemberId: {
                UserId: awsUserId,
              },
            })
          )
        } else if (granted.kind === kindIdentityAccountRole) {
          const PermissionSetArn = granted.labels?.['aws/permissionArn']
          const InstanceArn = granted.labels?.['aws/instanceArn']
          const TargetId = granted.labels?.['aws/accountId']

          await ssoadmin.send(
            new CreateAccountAssignmentCommand({
              InstanceArn,
              PrincipalId: awsUserId,
              PrincipalType: 'USER',
              PermissionSetArn,
              TargetId,
              TargetType: 'AWS_ACCOUNT',
            })
          )
        }
      } else {
        if (granted.kind === kindIdentityGroup) {
          const memberList = await idstore.send(
            new ListGroupMembershipsCommand({
              IdentityStoreId,
              GroupId,
            })
          )
          const membership = memberList.GroupMemberships.find(
            (g) => g.MemberId.UserId === awsUserId
          )

          if (membership) {
            await idstore.send(
              new DeleteGroupMembershipCommand({
                MembershipId: membership.MembershipId,
                IdentityStoreId,
              })
            )
          } else {
            console.warn(
              `@indent/aws-iam-integration: ApplyUpdate: [OK] member already removed { GroupId: ${GroupId}, UserId: ${awsUserId} }`
            )
          }
        } else if (granted.kind === kindIdentityAccountRole) {
          const PermissionSetArn = granted.labels?.['aws/permissionArn']
          const InstanceArn = granted.labels?.['aws/instanceArn']
          const TargetId = granted.labels?.['aws/accountId']

          await ssoadmin.send(
            new DeleteAccountAssignmentCommand({
              InstanceArn,
              PrincipalId: awsUserId,
              PrincipalType: 'USER',
              PermissionSetArn,
              TargetId,
              TargetType: 'AWS_ACCOUNT',
            })
          )
        }
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
      if (r.labels && r.labels['aws/id']) {
        return r.labels['aws/id']
      }

      return r.id
    })[0]
}
