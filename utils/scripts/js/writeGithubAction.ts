import fs from 'fs'
import YAML from 'yaml'
import { catalogue } from './catalogue'

const WEBHOOK_DIR = process.env.WEBHOOK_DIR || ''
const githubAction = fs.readFileSync(
  WEBHOOK_DIR + '/.github/workflows/deploy.yaml',
  'utf-8'
)

// type this githubActionObject
// Make this something other than type 'any'
// Look at YAML parse options
// End goal is to get an array
// Google: YAML.parse returns actual object
// Google: turn 'any' object into an array
let githubActionObject = YAML.parse(githubAction, { schema: 'core' })

if (githubActionObject?.jobs) {
  if (githubActionObject?.jobs?.terraform) {
    if (githubActionObject?.jobs?.terraform?.steps) {
      const currentItem = catalogue.filter((item) =>
        WEBHOOK_DIR.toLowerCase().includes(item.name.toLowerCase())
      )

      const { environmentVariables } = currentItem[0]
      let githubSecrets = {}

      environmentVariables.map(
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
      })
      fs.writeFileSync(
        '../.github/workflows/deploy-updated.yaml',
        updatedGithubAction,
        'utf-8'
      )
    }
  }
}
