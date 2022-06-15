import fs from 'fs'
import Mustache from 'mustache'
// import { catalogue } from catalogue.ts

export const renderTemplate = () => {
  const template = fs.readFileSync('../../README.example.md', 'utf-8')
  const rendered = Mustache.render(template, {
    runtime: 'AWS Lambda',
    integration: 'Okta',
    numIntegrations: '2',
    connectionToStepOne:
      '[Go to Okta > Security > API > Tokens](https://help.okta.com/en-us/Content/Topics/Security/API.htm#create-okta-api-token) and create a new API Token, then give the token a descriptive name like `Indent Auto Approvals`',
    connectionToStepTwo: 'Add this as `OKTA_TOKEN` as a GitHub Secret',
    connectionToStepThree:
      'Copy your Okta Domain URL and add this as `OKTA_DOMAIN` as a GitHub Secret',
    secretOne: {
      name: 'OKTA_DOMAIN',
      description:
        'Your Okta Domain. This is your [Okta URL](https://developer.okta.com/docs/guides/find-your-domain/findorg/) like `example.okta.com`',
    },
    secretTwo: {
      name: 'OKTA_TOKEN',
      description:
        'Your [Okta API Token](https://developer.okta.com/docs/guides/create-an-api-token/overview/). Get this from your Administrator. Your token needs the ["Group Administrators"](https://help.okta.com/en/prod/Content/Topics/Security/administrators-group-admin.htm) scope or higher for *every* group you plan to manage with Indent',
    },
    secretThree: {
      name: 'OKTA_SLACK_APP_ID',
      description:
        'Your Okta Slack App ID. Go to _Okta Admin Console_ &rarr; _Applications_ &rarr; Select "Slack" and copy the value from the URL, e.g. `0oabcdefghijklmnop` from `example-admin.okta.com/admin/apps/slack/0oabcdefghijklmnop/`',
    },
    secretFour: {
      name: 'OKTA_CLIENT_ID',
      description: `Your Service App's Client ID. Get this from the Okta Admin Dashboard or from the Okta API Response value you got when settting up your app.`,
    },
    secretFive: {
      name: 'OKTA_PRIVATE_KEY',
      description: 'The private RSA key you used to create your Service App',
    },
  })

  fs.writeFileSync('../README.md', rendered, 'utf-8')
}

renderTemplate()
