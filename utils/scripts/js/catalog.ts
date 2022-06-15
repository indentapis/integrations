import { CatalogueItem } from '..'

const INDENT_TAG = process.env.INDENT_TAG || 'missing_sha'

export const catalog: CatalogItem[] = [
  {
    name: 'Okta',
    integrations: ['OktaGroupIntegration', 'OktaUserIntegration'],
    runtimes: ['AWS Lambda'],
    environmentVariables: [
      {
        name: 'OKTA_DOMAIN',
        description:
          'Your Okta Domain. This is your [Okta URL](https://developer.okta.com/docs/guides/find-your-domain/findorg/) like `example.okta.com`',
      },
      {
        name: 'OKTA_TOKEN',
        description:
          'Your [Okta API Token](https://developer.okta.com/docs/guides/create-an-api-token/overview/). Get this from your Administrator. Your token needs the ["Group Administrators"](https://help.okta.com/en/prod/Content/Topics/Security/administrators-group-admin.htm) scope or higher for *every* group you plan to manage with Indent',
      },
      {
        name: 'OKTA_SLACK_APP_ID',
        description:
          'Your Okta Slack App ID. Go to _Okta Admin Console_ &rarr; _Applications_ &rarr; Select "Slack" and copy the value from the URL, e.g. `0oabcdefghijklmnop` from `example-admin.okta.com/admin/apps/slack/0oabcdefghijklmnop/`',
      },
      {
        name: 'OKTA_CLIENT_ID',
        description: `Your Service App's Client ID. Get this from the Okta Admin Dashboard or from the Okta API Response value you got when settting up your app.`,
      },
      {
        name: 'OKTA_PRIVATE_KEY',
        description: 'The private RSA key you used to create your Service App',
      },
    ],
    source:
      'git::https://github.com/indentapis/integrations//terraform/modules/indent_runtime_aws_lambda',
    artifactBucket: 'indent-artifacts-us-west-2',
    functionKey: 'webhooks/aws/lambda/okta-v0.0.1-canary-function.zip',
    depsKey: 'webhooks/aws/lambda/okta-v0.0.1-canary-deps.zip',
    readme: {
      connection: [
        "<a href='https://help.okta.com/en-us/Content/Topics/Security/API.htm#create-okta-api-token>Go to Okta > Security > API > Tokens</a>and create a new API Token, then give the token a descriptive name like <code>Indent Auto Approvals</code>",
        'Add this as `OKTA_TOKEN` as a GitHub Secret',
        'Copy your Okta Domain URL and add this as `OKTA_DOMAIN` as a GitHub Secret',
      ],
    },
  },
  {
    name: 'PagerDuty',
    runtimes: ['AWS Lambda'],
    integrations: ['PagerdutyDecisionIntegration'],
    environmentVariables: [{ name: 'PAGERDUTY_KEY', description: '' }],
    source:
      'git::https://github.com/indentapis/integrations//terraform/modules/indent_runtime_aws_lambda',
    artifactBucket: 'indent-artifacts-us-west-2',
    functionKey: `webhooks/aws/lambda/pagerduty-${INDENT_TAG}-function.zip`,
    depsKey: `webhooks/aws/lambda/pagerduty-${INDENT_TAG}-deps.zip`,
  },
  {
    name: 'Tailscale',
    integrations: ['TailscaleGroupIntegration'],
    runtimes: ['AWS Lambda'],
    environmentVariables: ['TAILSCALE_TAILNET', 'TAILSCALE_API_KEY'],
    source:
      'git::https://github.com/indentapis/integrations//terraform/modules/indent_runtime_aws_lambda',
    artifactBucket: 'indent-artifacts-us-west-2',
    functionKey: `webhooks/aws/lambda/tailscale-${INDENT_TAG}-function.zip`,
    depsKey: `webhooks/aws/lambda/tailscale-${INDENT_TAG}-deps.zip`,
  },
]
