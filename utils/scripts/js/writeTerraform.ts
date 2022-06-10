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

  const tfg = new TerraformGenerator({
    backend: {
      encrypt: true,
      bucket: '',
      region: 'us-west-2',
      key: 'indent/terraform.tfstate',
    },
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
      artifactBucket,
      functionKey,
      depsKey,
    }),
    env: envBlock,
  })

  // add variables
  tfg.variable('aws_region', {
    type: 'string',
    default: '',
  })

  tfg.variable('aws_profile', {
    type: 'string',
    default: '',
  })

  tfg.variable('indent_webhook_secret', {
    type: 'string',
    sensitive: true,
  })

  environmentVariables.forEach((env) => {
    tfg.variable(env, {
      type: 'string',
      default: '',
      sensitive: true,
    })
  })

  // add output
  tfg.output(`idt-${name}-webhook-url`, {
    value: `module.idt-${name}-webhook.function_url`,
    description: 'The URL of the deployed Lambda',
  })

  return tfg.write({ dir: WEBHOOK_DIR, format: true, tfFilename: 'main' })
}

writeTerraform(item[0])
