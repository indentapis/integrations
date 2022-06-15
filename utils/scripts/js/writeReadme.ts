import fs from 'fs'
import Mustache from 'mustache'
import { CatalogueItem } from '..'
import { catalogue } from './catalogue'

const WEBHOOK_DIR =
  process.env.WEBHOOK_DIR || 'tmp/examples/indent-example-webhook'

const currentIntegration = catalogue.filter((item) =>
  WEBHOOK_DIR.toLowerCase().includes(item.name.toLowerCase())
)

export const renderTemplate = (item: CatalogueItem) => {
  // import template from file
  const template = fs.readFileSync('../../README.example.md', 'utf-8')

  // destructure catalogueItem
  const { name, runtimes, integrations, readme } = item

  let formattedConnection = ['']

  if (readme?.connection) {
    const { connection } = readme
    formattedConnection = connection.map((step) => {
      return (step = '<li>' + step + '</li>')
    })
  }

  // render template
  const rendered = Mustache.render(template, {
    runtime: runtimes[0],
    integration: name,
    numIntegrations: integrations.length,
    connection: '<ul>' + formattedConnection.join('') + '</ul>',
    secretOne: {
      name: 'OKTA_DOMAIN',
      description: 'secretOne',
    },
    secretTwo: {
      name: 'OKTA_TOKEN',
      description: 'secretTwo',
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

renderTemplate(currentIntegration[0])
