export interface CatalogItem {
  name: string
  pkg?: string // e.g. `okta` for `okta-auto-approval` integration
  displayName: string
  runtimes: string[]
  integrations: string[]
  environmentVariables: string[]
  capabilities: string[]
  links: {
    repoSource: string
  }
  readme: {
    connection: string[]
    docsLink: string
  }
}

export const catalog: CatalogItem[] = [
  {
    name: 'okta',
    displayName: 'Okta',
    integrations: [
      'OktaGroupIntegration',
      'OktaUserIntegration',
      'OktaAppIntegration',
    ],
    runtimes: ['AWS Lambda'],
    links: {
      repoSource: 'packages/stable/indent-integration-okta',
    },
    environmentVariables: [
      'OKTA_DOMAIN',
      'OKTA_TOKEN',
      'OKTA_SLACK_APP_ID',
      'OKTA_CLIENT_ID',
      'OKTA_PRIVATE_KEY',
    ],
    capabilities: ['PullUpdate', 'ApplyUpdate'],
    readme: {
      connection: [
        '[Go to Okta > Security > API > Tokens](https://help.okta.com/en-us/Content/Topics/Security/API.htm#create-okta-api-token) and create a new API Token, then give the token a descriptive name like `indent-integration-okta`',
        'Add this as `OKTA_TOKEN` as a GitHub Secret',
        'Copy your Okta Domain URL and add this as `OKTA_DOMAIN` as a GitHub Secret',
      ],
      docsLink:
        '<a href="https://indent.com/docs/webhooks/deploy/okta-groups#create-a-new-repository" target="_blank">this link</a>',
    },
  },
  {
    pkg: 'okta',
    name: 'okta-auto-approval',
    displayName: 'Okta Auto Approval',
    integrations: ['OktaDecisionIntegration'],
    runtimes: ['AWS Lambda'],
    links: { repoSource: 'packages/stable/indent-integration-okta' },
    environmentVariables: [
      'OKTA_DOMAIN',
      'OKTA_TOKEN',
      'OKTA_SLACK_APP_ID',
      'OKTA_CLIENT_ID',
      'OKTA_PRIVATE_KEY',
      'AUTO_APPROVAL_OKTA_GROUPS',
      'AUTO_APPROVAL_DURATION',
    ],
    capabilities: ['GetDecision'],
    readme: {
      connection: [
        '[Go to Okta > Security > API > Tokens](https://help.okta.com/en-us/Content/Topics/Security/API.htm#create-okta-api-token) and create a new API Token, then give the token a descriptive name like `indent-integration-okta-approval`',
        'Add this as `OKTA_TOKEN` as a GitHub Secret',
        'Copy your Okta Domain URL and add this as `OKTA_DOMAIN` as a GitHub Secret',
        'Add the number of hours you want users to retain access for under `AUTO_APPROVAL_DURATION` as a GitHub Secret (1 hour by default)',
      ],
      docsLink:
        '<a href="https://indent.com/docs/integrations/okta-groups" target="_blank">this link</a>',
    },
  },
  {
    name: 'pagerduty',
    displayName: 'PagerDuty',
    runtimes: ['AWS Lambda'],
    integrations: ['PagerdutyDecisionIntegration'],
    environmentVariables: [
      'PAGERDUTY_KEY',
      'AUTO_APPROVAL_PAGERDUTY_SCHEDULES',
    ],
    capabilities: ['GetDecision'],
    links: {
      repoSource: 'packages/stable/indent-integration-pagerduty',
    },
    readme: {
      connection: [
        '[Go to PagerDuty > Integrations > API Access Keys](https://support.pagerduty.com/docs/api-access-keys#section-generate-a-general-access-rest-api-key) and create a new API key, then give the key a descriptive name like Indent Auto Approvals',
        'Add this as `PAGERDUTY_KEY` as a GitHub Secret',
        'Optional: select which on-call schedules get auto-approval by setting `AUTO_APPROVAL_PAGERDUTY_SCHEDULES` as a GitHub Secret',
      ],
      docsLink:
        '<a href="https://indent.com/docs/webhooks/deploy/pagerduty#actions-secrets" target="_blank">this link</a>',
    },
  },
  {
    name: 'opsgenie',
    displayName: 'OpsGenie',
    runtimes: ['AWS Lambda'],
    integrations: ['OpsgenieDecisionIntegration'],
    environmentVariables: [
      'OPSGENIE_KEY_KEY',
      'AUTO_APPROVAL_DURATION',
      'AUTO_APPROVAL_SCHEDULES',
    ],
    capabilities: ['GetDecision', 'PullUpdate'],
    links: {
      repoSource: 'packages/stable/indent-integration-opsgenie',
    },
    readme: {
      connection: [
        '[Go to OpsGenie > Settings > Integrations](https://support.atlassian.com/opsgenie/docs/create-a-default-api-integration/) and create a new API key for readonly access',
        'Add this as `OPSGENIE_KEY` as a GitHub Secret',
        'Optional: select which on-call schedules get auto-approval by setting `AUTO_APPROVAL_SCHEDULES` as a GitHub Secret',
      ],
      docsLink:
        '<a href="https://indent.com/docs/integrations/opsgenie" target="_blank">this link</a>',
    },
  },
  {
    name: 'tailscale',
    displayName: 'Tailscale',
    integrations: ['TailscaleGroupIntegration'],
    runtimes: ['AWS Lambda'],
    environmentVariables: ['TAILSCALE_TAILNET', 'TAILSCALE_API_KEY'],
    capabilities: ['PullUpdate', 'ApplyUpdate'],
    links: {
      repoSource: 'packages/stable/indent-integration-tailscale',
    },
    readme: {
      connection: [
        '[Go to Tailscale Personal Settings](https://login.tailscale.com/admin/settings/keys) and create a new API key.',
        'Add this as `TAILSCALE_API_KEY` as a GitHub Secret.',
        'Add [your tailnet](https://tailscale.com/kb/1136/tailnet/) (e.g. `yourdomain.com`) as `TAILSCALE_TAILNET` as a GitHub Secret.',
      ],
      docsLink:
        '<a href="https://indent.com/docs/webhooks/deploy/tailscale#step-1-configure-the-github-repo" target="_blank">this link</a>',
    },
  },
  {
    name: 'auto-approval',
    displayName: 'Auto-approval',
    integrations: ['AutoApproveIntegration'],
    runtimes: ['AWS Lambda'],
    environmentVariables: ['AUTO_APPROVAL_DURATION'],
    capabilities: ['PullUpdate', 'GetDecision'],
    links: {
      repoSource: 'packages/stable/indent-integration-auto-approval',
    },
    readme: {
      connection: [
        'Add the number of hours you want users to retain access for under `AUTO_APPROVAL_DURATION` as a GitHub Secret.',
      ],
      docsLink:
        '<a href="https://indent.com/docs/policies/auto-approvals" target="_blank">this link</a>',
    },
  },
  {
    name: 'incidentio',
    displayName: 'Incident.io',
    integrations: ['IncidentioDecisionIntegration'],
    runtimes: ['AWS Lambda'],
    environmentVariables: [
      'INCIDENTIO_API_KEY',
      'AUTO_APPROVAL_DURATION',
      'AUTO_APPROVAL_INCIDENTIO_ROLES',
    ],
    capabilities: ['PullUpdate', 'GetDecision'],
    links: {
      repoSource: 'packages/stable/indent-integration-incidentio',
    },
    readme: {
      connection: [
        "[Go to Incident.io's dashboard](https://app.incident.io/login) and click **API Keys → + Add new**",
        'Copy the key that appears as a GitHub Secret named `INCIDENTIO_API_KEY`',
        'Add this as `INCIDENTIO_API_KEY` as a GitHub Secret.',
        'Optional: Add the number of hours you want users to retain access for under `AUTO_APPROVAL_DURATION` as a GitHub Secret.',
        'Optional: Select which role assignments receiving auto approval by setting `AUTO_APPROVAL_INCIDENTIO_ROLES` as a GitHub Secret.',
      ],
      docsLink:
        '<a href="https://indent.com/docs/policies/auto-approvals" target="_blank">this link</a>',
    },
  },
  {
    name: 'aws-iam',
    displayName: 'AWS IAM',
    integrations: ['AWSIAMGroupIntegration', 'AWSIdentityCenterIntegration'],
    runtimes: ['AWS Lambda'],
    environmentVariables: [
      'DEFAULT_USER_PW',
      'INDENT_AWS_DIRECT_ASSIGNMENT',
      'AWS_STS_ASSUME_ROLE',
      'AWS_STS_EXTERNAL_ID',
    ],
    capabilities: ['PullUpdate', 'ApplyUpdate'],
    links: { repoSource: 'packages/beta/indent-integration-aws-iam' },
    readme: {
      connection: [],
      docsLink:
        '<a href="https://indent.com/docs/integrations/aws-iam" target="_blank">this link</a>',
    },
  },
]
