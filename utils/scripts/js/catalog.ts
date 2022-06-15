import { CatalogItem } from '..'

const INDENT_TAG = process.env.INDENT_TAG || 'missing_sha'

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
    functionKey: `webhooks/aws/lambda/okta-${INDENT_TAG}-canary-function.zip`,
    depsKey: `webhooks/aws/lambda/okta-${INDENT_TAG}-canary-deps.zip`,
  },
  {
    name: 'PagerDuty',
    runtimes: ['AWS Lambda'],
    integrations: ['PagerdutyDecisionIntegration'],
    environmentVariables: ['PAGERDUTY_KEY'],
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
