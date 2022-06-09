import { join } from 'path'
import { catalogue } from './js/catalogue'
import { writeIntegration } from './js/writeIntegration'
import { writeTerraform } from './js/writeTerraform'

const WEBHOOK_DIR =
  process.env.WEBHOOK_DIR || 'tmp/examples/aws-lambda-example-webhook'

const currentItem = catalogue.filter((item) =>
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
