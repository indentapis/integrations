export interface CatalogItem {
  name: string
  runtimes: string[]
  integrations: string[]
  environmentVariables: string[]
  readme: {
    connection: string[]
    docsLink: string
  }
}

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
    readme: {
      connection: [
        '[Go to Okta > Security > API > Tokens](https://help.okta.com/en-us/Content/Topics/Security/API.htm#create-okta-api-token) and create a new API Token, then give the token a descriptive name like `Indent Auto Approvals`',
        'Add this as `OKTA_TOKEN` as a GitHub Secret',
        'Copy your Okta Domain URL and add this as `OKTA_DOMAIN` as a GitHub Secret',
      ],
      docsLink:
        '<a href="https://indent.com/docs/webhooks/deploy/okta-groups#create-a-new-repository" target="_blank">this link</a>',
    },
  },
  {
    name: 'PagerDuty',
    runtimes: ['AWS Lambda'],
    integrations: ['PagerdutyDecisionIntegration'],
    environmentVariables: ['PAGERDUTY_KEY'],
    readme: {
      connection: [
        '[Go to PagerDuty > Integrations > API Access Keys](https://support.pagerduty.com/docs/api-access-keys#section-generate-a-general-access-rest-api-key) and create a new API key, then give the key a descriptive name like Indent Auto Approvals',
        'Add this as `PAGERDUTY_KEY` as a GitHub Secret',
      ],
      docsLink:
        '<a href="https://indent.com/docs/webhooks/deploy/pagerduty#actions-secrets" target="_blank">this link</a>',
    },
  },
  {
    name: 'Tailscale',
    integrations: ['TailscaleGroupIntegration'],
    runtimes: ['AWS Lambda'],
    environmentVariables: ['TAILSCALE_TAILNET', 'TAILSCALE_API_KEY'],
    readme: {
      connection: [
        '[Go to Tailscale Personal Settings](https://login.tailscale.com/admin/settings/keys) and create a new API key.',
        'Add this as `TAILSCALE_KEY` as a GitHub Secret.',
      ],
      docsLink:
        '<a href="https://indent.com/docs/webhooks/deploy/tailscale#step-1-configure-the-github-repo" target="_blank">this link</a>',
    },
  },
]
