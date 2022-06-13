import { arg, Map, TerraformGenerator } from 'terraform-generator'
import { catalogue } from './catalogue'
import { CatalogueItem } from './format-types'

const WEBHOOK_DIR =
  process.env.WEBHOOK_DIR || 'tmp/examples/aws-lambda-example-webhook'

const item = catalogue.filter((c) =>
  WEBHOOK_DIR.toLowerCase().includes(c.name.toLowerCase())
)

export const writeTerraform = (catalogueItem: CatalogueItem) => {
  // destructure catalogue item
  const {
    name,
    source,
    artifactBucket,
    functionKey,
    depsKey,
    environmentVariables,
  } = catalogueItem

  const tfg = new TerraformGenerator()

  tfg.backend('s3', {
    encrypt: true,
    bucket: '',
    region: 'us-west-2',
    key: 'indent/terraform.tfstate',
  })

  // create environment variable map for main
  const envObject = environmentVariables.reduce((obj, envVar) => {
    if (!obj[envVar]) {
      obj[envVar.toUpperCase()] = arg(`var.${envVar.toLowerCase()}`)
    }
    return obj
  }, {})

  const envBlock = new Map({
    ...envObject,
  })
  // create modules
  tfg.module(`idt-${name}-webhook`, {
    source,
    name: `idt-${name}-webhook`,
    indent_webhook_secret: arg('var.indent_webhook_secret'),
    artifact: new Map({
      artifact_bucket: artifactBucket,
      function_key: functionKey,
      deps_key: depsKey,
    }),
    env: envBlock,
  })

  const tfg2 = new TerraformGenerator()
  // add variables
  tfg2.variable('aws_region', {
    type: 'string',
    default: 'us-west-2',
  })

  tfg2.variable('aws_profile', {
    type: 'string',
    default: 'default',
  })

  tfg2.variable('indent_webhook_secret', {
    type: 'string',
    sensitive: true,
  })

  environmentVariables.forEach((env) => {
    tfg2.variable(env.toLowerCase(), {
      type: 'string',
      default: '',
      sensitive: true,
    })
  })
  tfg2.write({ dir: WEBHOOK_DIR, format: true, tfFilename: 'variables' })
  // add output
  const tfg3 = new TerraformGenerator()

  tfg3.output(`idt-${name}-webhook-url`, {
    value: `module.idt-${name}-webhook.function_url`,
    description: 'The URL of the deployed Lambda',
  })
  tfg3.write({ dir: WEBHOOK_DIR, format: true, tfFilename: 'output' })

  return tfg.write({ dir: WEBHOOK_DIR, format: true, tfFilename: 'main' })
}

writeTerraform(item[0])
