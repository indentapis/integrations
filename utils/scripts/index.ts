import { join } from 'path'
import { catalog } from './js/catalog'
import { writeIntegration } from './js/writeIntegration'
// import { writeReadme } from './js/writeReadme'
import { writeTerraform } from './js/writeTerraform'

const WEBHOOK_DIR =
  process.env.WEBHOOK_DIR || 'tmp/examples/aws-lambda-example-webhook'

const currentItem = catalog.filter((item) =>
  WEBHOOK_DIR.toLowerCase().includes(item.name)
)

const { integrations, name } = currentItem[0]

const integrationPath = join(
  process.cwd(),
  process.env.WEBHOOK_DIR,
  'src',
  'index.ts'
)

writeIntegration({
  functionNames: integrations,
  integrationName: name,
  path: integrationPath,
})

writeTerraform(currentItem[0])

// writeReadme(currentItem[0])
