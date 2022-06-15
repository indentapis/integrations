// import { CatalogueItem } from '..'

// export const catalogue: CatalogueItem[] = [
//   {
//     name: 'Okta',
//     integrations: ['OktaGroupIntegration', 'OktaUserIntegration'],
//     runtimes: ['AWS Lambda'],
//     environmentVariables: [
//       {
//         name: 'OKTA_DOMAIN',
//         description:
//           'Your Okta Domain. This is your <a href="https://developer.okta.com/docs/guides/find-your-domain/findorg/" target="_blank">Okta URL</a> like <code>example.okta.com</code>',
//         alternateValue: false,
//       },
//       {
//         name: 'OKTA_TOKEN',
//         description:
//           'Your <a href="https://developer.okta.com/docs/guides/create-an-api-token/overview/">Okta API Token</a>. Get this from your Administrator. Your token needs the <a href="https://help.okta.com/en/prod/Content/Topics/Security/administrators-group-admin.htm" target="_blank">"Group Administrators"</a> scope or higher for <strong>every</strong> group you plan to manage with Indent',
//         alternateValue: false,
//       },
//       {
//         name: 'OKTA_SLACK_APP_ID',
//         description:
//           'Your Okta Slack App ID. Go to <em>Okta Admin Console</em> &rarr; <em>Applications</em> &rarr; Select "Slack" and copy the value from the URL, e.g. <code>0oabcdefghijklmnop</code> from <code>example-admin.okta.com/admin/apps/slack/0oabcdefghijklmnop/</code>',
//         alternateValue: false,
//       },
//       {
//         name: 'OKTA_CLIENT_ID',
//         description: `Your Service App's Client ID. Get this from the Okta Admin Dashboard or from the Okta API Response value you got when settting up your app.`,
//         alternateValue: true,
//       },
//       {
//         name: 'OKTA_PRIVATE_KEY',
//         description: 'The private RSA key you used to create your Service App.',
//         alternateValue: true,
//       },
//     ],
//     source:
//       'git::https://github.com/indentapis/integrations//terraform/modules/indent_runtime_aws_lambda',
//     artifactBucket: 'indent-artifacts-us-west-2',
//     functionKey: 'webhooks/aws/lambda/okta-v0.0.1-canary-function.zip',
//     depsKey: 'webhooks/aws/lambda/okta-v0.0.1-canary-deps.zip',
//     readme: {
//       connection: [
//         '<a href="https://help.okta.com/en-us/Content/Topics/Security/API.htm#create-okta-api-token">Go to Okta > Security > API > Tokens</a> and create a new API Token, then give the token a descriptive name like <code>Indent Auto Approvals</code>',
//         'Add this as <code>OKTA_TOKEN</code> as a GitHub Secret',
//         'Copy your Okta Domain URL and add this as <code>OKTA_DOMAIN</code> as a GitHub Secret',
//       ],
//       hasAlternate: true,
//       options: {
//         optionOne: {
//           name: 'Option 1: Okta Admin API Token',
//           description:
//             'Add the credentials for one of the authentication options below to your GitHub Secrets.',
//         },
//         optionTwo: {
//           name: 'Option 2: Okta Service App',
//           description:
//             'Create an Okta Service App based on our <a href="https://indent.com/docs/integrations/okta#option-2-service-app-with-api-scopes" target="_blank">guide</a>.',
//         },
//       },
//     },
//   },
//   {
//     name: 'PagerDuty',
//     runtimes: ['AWS Lambda'],
//     integrations: ['PagerdutyDecisionIntegration'],
//     environmentVariables: [
//       { name: 'PAGERDUTY_KEY', description: '', alternateValue: false },
//     ],
//     source:
//       'git::https://github.com/indentapis/integrations//terraform/modules/indent_runtime_aws_lambda',
//     artifactBucket: 'indent-artifacts-us-west-2',
//     functionKey: 'webhooks/aws/lambda/pagerduty-v0.0.1-canary-function.zip',
//     depsKey: 'webhooks/aws/lambda/pagerduty-v0.0.1-canary-deps.zip',
//     readme: {},
//   },
//   {
//     name: 'Tailscale',
//     integrations: ['TailscaleGroupIntegration'],
//     runtimes: ['AWS Lambda'],
//     environmentVariables: ['TAILSCALE_TAILNET', 'TAILSCALE_API_KEY'],
//     source:
//       'git::https://github.com/indentapis/integrations//terraform/modules/indent_runtime_aws_lambda',
//     artifactBucket: 'indent-artifacts-us-west-2',
//     functionKey: 'webhooks/aws/lambda/tailscale-v0.0.1-canary-function.zip',
//     depsKey: 'webhooks/aws/lambda/tailscale-v0.0.1-canary-deps.zip',
//   },
// ]
