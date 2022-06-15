import { CatalogueItem } from './format-types'

const INDENT_TAG = process.env.INDENT_TAG || 'missing_sha'

export const catalogue: CatalogueItem[] = [
  {
    name: 'pagerduty',
    environmentVariables: ['PAGERDUTY_KEY'],
    integrations: ['PagerdutyDecisionIntegration'],
    source:
      'git::https://github.com/indentapis/integrations//terraform/modules/indent_runtime_aws_lambda',
    artifactBucket: 'indent-artifacts-us-west-2',
    functionKey: `webhooks/aws/lambda/pagerduty-${INDENT_TAG}-canary-function.zip`,
    depsKey: `webhooks/aws/lambda/pagerduty-${INDENT_TAG}-canary-deps.zip`,
  },
  {
    name: 'okta',
    integrations: ['OktaGroupIntegration', 'OktaUserIntegration'],
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
    name: 'tailscale',
    integrations: ['TailscaleGroupIntegration'],
    environmentVariables: ['TAILSCALE_TAILNET', 'TAILSCALE_API_KEY'],
    source:
      'git::https://github.com/indentapis/integrations//terraform/modules/indent_runtime_aws_lambda',
    artifactBucket: 'indent-artifacts-us-west-2',
    functionKey: `webhooks/aws/lambda/tailscale-${INDENT_TAG}-canary-function.zip`,
    depsKey: `webhooks/aws/lambda/tailscale-${INDENT_TAG}-canary-deps.zip`,
  },
]
