import { CatalogueItem } from './utils'

export const catalogue: CatalogueItem[] = [
  {
    name: 'pagerduty',
    environmentVariables: ['PAGERDUTY_KEY'],
    integrations: ['PagerdutyDecisionIntegration'],
    source:
      'git::https://github.com/indentapis/integrations//terraform/modules/indent_runtime_aws_lambda',
    artifactBucket: 'indent-artifacts-us-west-2',
    functionKey: 'webhooks/aws/lambda/pagerduty-v0.0.1-canary-function.zip',
    depsKey: 'webhooks/aws/lambda/pagerduty-v0.0.1-canary-deps.zip',
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
    functionKey: 'webhooks/aws/lambda/okta-v0.0.1-canary-function.zip',
    depsKey: 'webhooks/aws/lambda/okta-v0.0.1-canary-deps.zip',
  },
]
