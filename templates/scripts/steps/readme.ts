import { readFile, unlink, writeFile } from 'fs/promises'
import Mustache from 'mustache'
import { CatalogItem } from './catalog'

export async function writeReadme(item: CatalogItem, path) {
  // import template from file
  const template = await readFile(path + '/README.example.md', 'utf-8')

  // destructure catalogItem
  const { displayName, runtimes, integrations, readme, capabilities } = item

  const { connection, docsLink } = readme
  // render template
  const rendered = Mustache.render(template, {
    runtime: runtimes[0],
    integration: displayName,
    numIntegrations: integrations.length,
    connection,
    docsLink,
    capabilities,
  })
  await unlink(path + '/README.example.md')
  return await writeFile(path + '/README.md', rendered, 'utf-8')
}
