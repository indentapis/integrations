import { catalog } from './js/catalog'
import writeIntegration from './js/writeIntegration'
import writeReadme from './js/writeReadme'
import { writeTerraform } from './js/writeTerraform'

export default function createGitHubTemplate() {
  const WEBHOOK_DIR =
    process.env.WEBHOOK_DIR || 'tmp/examples/aws-lambda-example-webhook'

  const currentItem = catalog.filter((item) =>
    WEBHOOK_DIR.toLowerCase().includes(item.name)
  )

  writeIntegration(currentItem[0], WEBHOOK_DIR)

  writeTerraform(currentItem[0])

  writeReadme(currentItem[0], WEBHOOK_DIR)
}

createGitHubTemplate()
