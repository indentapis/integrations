import { readFileSync, writeFileSync } from 'fs'
import Mustache from 'mustache'
import type { CatalogItem } from '..'

export default function writeReadme(item: CatalogItem, path) {
  // import template from file
  const template = readFileSync(path + '/README.example.md', 'utf-8')

  // destructure catalogItem
  const { name, runtimes, integrations, readme } = item

  const { connection, docsLink } = readme
  // render template
  const rendered = Mustache.render(template, {
    runtime: runtimes[0],
    integration: name,
    numIntegrations: integrations.length,
    connection,
    docsLink,
  })

  writeFileSync(path + '/README.md', rendered, 'utf-8')
}
