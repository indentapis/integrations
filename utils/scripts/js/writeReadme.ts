import fs from 'fs'
import Mustache from 'mustache'
import { CatalogItem, EnvironmentVariable } from '..'
import { catalog } from './catalog.example'

const WEBHOOK_DIR =
  process.env.WEBHOOK_DIR || 'tmp/examples/indent-example-webhook'

const currentIntegration = catalog.filter((item) =>
  WEBHOOK_DIR.toLowerCase().includes(item.name.toLowerCase())
)

export const writeReadme = (item: CatalogItem) => {
  // import template from file
  const template = fs.readFileSync(
    process.cwd() + '/../../README.example.md',
    'utf-8'
  )

  // destructure catalogItem
  const { name, runtimes, integrations, environmentVariables, readme } = item

  // join environment variables in HTML
  // const optionTwoEntries = readme.hasAlternate
  //   ? {
  //       name: readme.options.optionTwo.name,
  //       description: readme.options.optionTwo.description,
  //       entries: environmentVariables
  //         .map((e) => `<tr><td>${e.name}</td><td>${e.description}</td></tr>`)
  //         .join(''),
  //     }
  //   : false
  // render template
  const rendered = Mustache.render(template, {
    runtime: runtimes[0],
    integration: name,
    numIntegrations: integrations.length,
    connection: readme?.connection ? readme.connection : '',
    optionOne: {
      name: readme.options.optionOne.name,
      description: readme.options.optionOne.description,
      environmentVariables: {
        envVars: environmentVariables.filter(
          (e: EnvironmentVariable) => !e.alternateValue
        ),
        value: () => {
          return (text: EnvironmentVariable, render) => {
            return render(
              '<tr><td>' +
                text.name +
                '</td><td>' +
                text.description +
                '</td></tr>'
            )
          }
        },
      },
    },
    optionTwo: false,
  })

  fs.writeFileSync('../README.md', rendered, 'utf-8')
}

writeReadme(currentIntegration[0])
