import fs from 'fs'
import YAML from 'yaml'
import { CatalogItem } from './catalog'

export async function writeGithubAction(currentItem: CatalogItem, WEBHOOK_DIR) {
  const githubAction = fs.readFileSync(
    WEBHOOK_DIR + '/.github/workflows/deploy.example.yaml',
    'utf-8'
  )

  let githubActionObject = YAML.parse(githubAction, { schema: 'core' })

  if (githubActionObject?.jobs) {
    if (githubActionObject?.jobs?.terraform) {
      if (githubActionObject?.jobs?.terraform?.steps) {
        let { environmentVariables } = currentItem
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
              step.name === 'Terraform Apply' ||
              step.name === 'Terraform Output'
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
        fs.unlinkSync(WEBHOOK_DIR + '/.github/workflows/deploy.example.yaml')
        fs.writeFileSync(
          WEBHOOK_DIR + '/.github/workflows/deploy.yaml',
          updatedGithubAction,
          'utf-8'
        )
      }
    }
  }
}
