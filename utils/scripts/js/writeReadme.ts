const { readFileSync, writeFileSync } = require('fs')
const { markdownTable } = require('markdown-table')
const Mustache = require('mustache')
const { catalog } = require('./catalog.example')
import type { CatalogItem } from '..'

const WEBHOOK_DIR =
  process.env.WEBHOOK_DIR || 'tmp/examples/indent-example-webhook'

const currentIntegration = catalog.filter((item) =>
  WEBHOOK_DIR.toLowerCase().includes(item.name.toLowerCase())
)

const writeReadme = (item: CatalogItem) => {
  // import template from file
  const template = readFileSync('../README.example.md', 'utf-8')

  // destructure catalogItem
  const { name, runtimes, integrations, readme } = item

  const { connection, tables } = readme
  const formattedTables = tables.map((t) => {
    return {
      title: t.title,
      table: markdownTable(t.table),
    }
  })

  const textTables = formattedTables.map(
    (t) => `<details><summary>${t.title}</summary><p>

    ${t.table.toString()}

    </p></details>`
  )

  console.log(textTables)
  // render template
  const rendered = Mustache.render(template, {
    runtime: runtimes[0],
    integration: name,
    numIntegrations: integrations.length,
    connection,
    options: textTables,
  })

  writeFileSync('../README.md', rendered, 'utf-8')
}

writeReadme(currentIntegration[0])
