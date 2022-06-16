import { CatalogItem } from '..'

export const catalog: CatalogItem[] = [
  {
    name: 'Okta',
    integrations: ['OktaGroupIntegration', 'OktaUserIntegration'],
    runtimes: ['AWS Lambda'],
    environmentVariables: [
      'OKTA_DOMAIN',
      'OKTA_TOKEN',
      'OKTA_SLACK_APP_ID',
      'OKTA_CLIENT_ID',
      'OKTA_PRIVATE_KEY',
    ],
    source:
      'git::https://github.com/indentapis/integrations//terraform/modules/indent_runtime_aws_lambda',
    artifactBucket: 'indent-artifacts-us-west-2',
    functionKey: 'webhooks/aws/lambda/okta-v0.0.1-canary-function.zip',
    depsKey: 'webhooks/aws/lambda/okta-v0.0.1-canary-deps.zip',
    readme: {
      connection: [
        '[Go to Okta > Security > API > Tokens](https://help.okta.com/en-us/Content/Topics/Security/API.htm#create-okta-api-token) and create a new API Token, then give the token a descriptive name like `Indent Auto Approvals`',
        'Add this as `OKTA_TOKEN` as a GitHub Secret',
        'Copy your Okta Domain URL and add this as `OKTA_DOMAIN` as a GitHub Secret',
      ],
      tables: [
        {
          title: 'Option 1: Okta Admin API Token',
          table: [
            [
              'INDENT_WEBHOOK_SECRET',
              'Get this from your [Indent App](https://indent.com/spaces?next=/manage/spaces/%5Bspace%5D/apps/) or an [Indent Webhook](https://indent.com/docs/webhooks/deploy/okta-groups) in the Dashboard',
            ],
            [
              'OKTA_DOMAIN',
              'Your Okta Domain. This is your [Okta URL](https://developer.okta.com/docs/guides/find-your-domain/findorg/) like `example.okta.com`',
            ],
            [
              'OKTA_TOKEN',
              'Your [Okta API Token](https://developer.okta.com/docs/guides/create-an-api-token/overview/). Get this from your Administrator. Your token needs the ["Group Administrators"](https://help.okta.com/en/prod/Content/Topics/Security/administrators-group-admin.htm) scope or higher for _every* group you plan to manage with Indent.',
            ],
            [
              'OKTA_SLACK_APP_ID',
              'Optional: Your Okta Slack App ID. Go to _Okta Admin Console_ &rarr; _Applications_ &rarr; Select "Slack" and copy the value from the URL, e.g. `0oabcdefghijklmnop` from `example-admin.okta.com/admin/apps/slack/0oabcdefghijklmnop/`',
            ],
            [
              'AWS_ACCESS_KEY_ID',
              '[Your Programmatic AWS Access Key ID.](https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html#access-keys-and-secret-access-keys',
            ],
            [
              'AWS_SECRET_ACCESS_KEY',
              '[Your Programmatic AWS Secret Access Key.](https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html#access-keys-and-secret-access-keys)',
            ],
            [
              'AWS_SESSION_TOKEN',
              'Optional: [Your AWS Session Token](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_use-resources.html#using-temp-creds-sdk-cli). **Note: If you use an AWS Session ID you will need to update it for each deployment once the session expires**',
            ],
          ],
        },
        {
          title: 'Option 2: Okta OAuth2.0 Service App',
          table: [
            [
              'INDENT_WEBHOOK_SECRET',
              'Get this from your [Indent App](https://indent.com/spaces?next=/manage/spaces/%5Bspace%5D/apps/) or an [Indent Webhook](https://indent.com/docs/webhooks/deploy/okta-groups) in the Dashboard',
            ],
            [
              'OKTA_DOMAIN',
              'Your Okta Domain. This is your [Okta URL](https://developer.okta.com/docs/guides/find-your-domain/findorg/) like `example.okta.com`',
            ],
            [
              'OKTA_CLIENT_ID',
              "Your Service App's Client ID. Get this from the Okta Admin Dashboard or from the Okta API Response value you got when settting up your app.",
            ],
            [
              'OKTA_PRIVATE_KEY',
              'The private RSA key you used to create your Service App.',
            ],
            [
              'OKTA_SLACK_APP_ID',
              'Optional: Your Okta Slack App ID. Go to _Okta Admin Console_ &rarr; _Applications_ &rarr; Select "Slack" and copy the value from the URL, e.g. `0oabcdefghijklmnop` from `example-admin.okta.com/admin/apps/slack/0oabcdefghijklmnop/`',
            ],
            [
              'AWS_ACCESS_KEY_ID',
              '[Your Programmatic AWS Access Key ID](https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html#access-keys-and-secret-access-keys',
            ],
            [
              'AWS_SECRET_ACCESS_KEY',
              '[Your Programmatic AWS Secret Access Key](https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html#access-keys-and-secret-access-keys)',
            ],
            [
              'AWS_SESSION_TOKEN',
              'Optional: [Your AWS Session Token](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_temp_use-resources.html#using-temp-creds-sdk-cli). **Note: If you use an AWS Session ID you will need to update it for each deployment once the session expires**',
            ],
          ],
        },
      ],
    },
  },
]
// {
//   name: 'PagerDuty',
//   runtimes: ['AWS Lambda'],
//   integrations: ['PagerdutyDecisionIntegration'],
//   environmentVariables: ['PAGERDUTY_KEY'],
//   source:
//     'git::https://github.com/indentapis/integrations//terraform/modules/indent_runtime_aws_lambda',
//   artifactBucket: 'indent-artifacts-us-west-2',
//   functionKey: 'webhooks/aws/lambda/pagerduty-v0.0.1-canary-function.zip',
//   depsKey: 'webhooks/aws/lambda/pagerduty-v0.0.1-canary-deps.zip',
// },
// {
//   name: 'Tailscale',
//   integrations: ['TailscaleGroupIntegration'],
//   runtimes: ['AWS Lambda'],
//   environmentVariables: ['TAILSCALE_TAILNET', 'TAILSCALE_API_KEY'],
//   source:
//     'git::https://github.com/indentapis/integrations//terraform/modules/indent_runtime_aws_lambda',
//   artifactBucket: 'indent-artifacts-us-west-2',
//   functionKey: 'webhooks/aws/lambda/tailscale-v0.0.1-canary-function.zip',
//   depsKey: 'webhooks/aws/lambda/tailscale-v0.0.1-canary-deps.zip',
// },
