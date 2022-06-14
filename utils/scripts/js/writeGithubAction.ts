import fs from 'fs'
import YAML from 'yaml'
import { catalogue } from './catalogue'

const WEBHOOK_DIR =
  process.env.WEBHOOK_DIR || 'tmp/examples/aws-lambda-example-webhook'
const githubAction = fs.readFileSync(
  WEBHOOK_DIR + '/.github/workflows/deploy.yaml',
  'utf-8'
)

let githubActionObject = YAML.parse(githubAction, { schema: 'core' })

if (githubActionObject?.jobs) {
  if (githubActionObject?.jobs?.terraform) {
    if (githubActionObject?.jobs?.terraform?.steps) {
      const currentItem = catalogue.filter((item) =>
        WEBHOOK_DIR.toLowerCase().includes(item.name.toLowerCase())
      )

      let { environmentVariables } = currentItem[0]
      let githubSecrets = {}

      environmentVariables = ['INDENT_WEBHOOK_SECRET']
        .concat(environmentVariables)
        .map(
          (e) =>
            (githubSecrets[
              `TF_VAR_${e.toLowerCase()}`
            ] = `\$\{\{ secrets.${e} \}\}`)
        )

      githubActionObject.jobs.terraform.steps.forEach((step) => {
        if (step?.name) {
          if (
            step.name === 'Terraform Plan' ||
            step.name === 'Terraform Apply'
          ) {
            step.env = githubSecrets
          }
        }
      })

      const updatedGithubAction = YAML.stringify(githubActionObject, {
        nullStr: '',
        aliasDuplicateObjects: false,
        lineWidth: 0,
      })
      fs.writeFileSync(
        WEBHOOK_DIR + '/.github/workflows/deploy.yaml',
        updatedGithubAction,
        'utf-8'
      )
    }
  }
}
