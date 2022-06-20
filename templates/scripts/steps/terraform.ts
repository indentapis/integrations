import { arg, Map, TerraformGenerator } from 'terraform-generator'
import { CatalogItem } from './catalog'

const INDENT_TAG = process.env.INDENT_TAG || 'unknown'
const WEBHOOK_DIR =
  process.env.WEBHOOK_DIR || 'tmp/examples/aws-lambda-example-webhook'

export const writeTerraform = (catalogItem: CatalogItem) => {
  const { name, environmentVariables } = catalogItem
  const tfg = new TerraformGenerator()

  const artifactBucket = 'indent-artifacts-us-west-2'
  const artifactPrefix = 'webhooks/aws/lambda/'
  const functionKey = `${artifactPrefix}${name}-${INDENT_TAG}-function.zip`
  const depsKey = `${artifactPrefix}${name}-${INDENT_TAG}-deps.zip`
  const moduleSource =
    'git::https://github.com/indentapis/integrations//terraform/modules/indent_runtime_aws_lambda'

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
  const moduleName = `idt-${name.toLowerCase()}-webhook`

  tfg.comment(`${name} integration module`)
  tfg.comment(`https://github.com/indentapis/integrations/commit/${INDENT_TAG}`)
  tfg.module(moduleName, {
    source: moduleSource,
    name: moduleName,
    indent_webhook_secret: arg('var.indent_webhook_secret'),
    artifact: new Map({
      bucket: artifactBucket,
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

  tfg3.output(`${moduleName}-url`, {
    value: arg(`module.${moduleName}.function_url`),
    description: 'The URL of the deployed Lambda',
  })
  tfg3.write({ dir: WEBHOOK_DIR, format: true, tfFilename: 'output' })

  return tfg.write({ dir: WEBHOOK_DIR, format: true, tfFilename: 'main' })
}
