import { readFile, unlink, writeFile } from 'fs/promises'
import Mustache from 'mustache'
import type { CatalogItem } from '..'

export default async function writeReadme(item: CatalogItem, path) {
  // import template from file
  const template = await readFile(path + '/README.example.md', 'utf-8')

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
  await unlink(path + '/README.example.md')
  return await writeFile(path + '/README.md', rendered, 'utf-8')
}
