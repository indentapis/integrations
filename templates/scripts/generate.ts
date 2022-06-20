import { catalog } from './steps/catalog'
import { writeGithubAction } from './steps/github-action'
import { writeIntegration } from './steps/integration'
import { writeReadme } from './steps/readme'
import { writeTerraform } from './steps/terraform'

export default function createGitHubTemplate() {
  const WEBHOOK_DIR =
    process.env.WEBHOOK_DIR || 'tmp/examples/aws-lambda-example-webhook'

  const currentItem = catalog.find((item) =>
    WEBHOOK_DIR.toLowerCase().includes(item.name.toLowerCase())
  )

  if (!currentItem) {
    throw new Error(`not found WEBHOOK_DIR: ${WEBHOOK_DIR}`)
  }

  writeTerraform(currentItem)
  writeReadme(currentItem, WEBHOOK_DIR)
  writeIntegration(currentItem, WEBHOOK_DIR)
  writeGithubAction(currentItem, WEBHOOK_DIR)
}

createGitHubTemplate()
