import { arg, TerraformGenerator } from 'terraform-generator'
import { catalogue } from './catalog'
import { CatalogueItem } from './utils'

const WEBHOOK_DIR =
  process.env.WEBHOOK_DIR || 'tmp/examples/aws-lambda-example-webhook'

const generateTfVars = (environmentVariables: string[]) => {
  const tfg = new TerraformGenerator()

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

  // please help - map didn't work
  for (let v = 0; v < environmentVariables.length; v += 1) {
    tfg.variable(`${environmentVariables[v]}`, {
      type: 'string',
      default: '',
      sensitive: true,
    })
  }

  tfg.write({ dir: WEBHOOK_DIR, format: true, tfFilename: 'variables' })
}

const generateTfOutput = (name: string) => {
  const tfg = new TerraformGenerator()

  tfg.output(`idt-${name}-webhook-url`, {
    value: `module.idt-${name}-webhook-url.function_url`,
    description: 'The URL of the deployed Lambda',
  })

  tfg.write({ dir: WEBHOOK_DIR, format: true, tfFilename: 'outputs' })
}

const generateTfMain = ({
  name,
  source,
  artifactBucket,
  functionKey,
  depsKey,
  envVars,
}: {
  name: string
  source: string
  artifactBucket: string
  functionKey: string
  depsKey: string
  envVars: string[]
}) => {
  const tfg = new TerraformGenerator({
    backend: {
      encrypt: true,
      artifactBucket,
      region: 'us-west-2',
      key: 'indent/terraform.tfstate',
    },
  })

  let mappedVars = {}

  envVars.forEach((e: string) => {
    mappedVars[e] = arg(`var.${e.toLowerCase()}`)
  })

  tfg.module(name, {
    source,
    name: `idt-${name}-webhook`,
    indent_webhook_secret: 'var.indent_webhook_secret',
    artifact: {
      artifactBucket,
      functionKey,
      depsKey,
    },
    env: { ...mappedVars },
  })

  tfg.write({ dir: WEBHOOK_DIR, format: true, tfFilename: 'main' })
}

const generateFiles = (data: CatalogueItem[]) => {
  const integration = data.filter((d: CatalogueItem) => {
    return WEBHOOK_DIR.toLowerCase().includes(d.name.toLowerCase())
  })

  const {
    name,
    source,
    environmentVariables,
    artifactBucket,
    functionKey,
    depsKey,
  } = integration[0]

  generateTfMain({
    name,
    source,
    envVars: environmentVariables,
    artifactBucket,
    functionKey,
    depsKey,
  })
  generateTfOutput(name)
  generateTfVars(environmentVariables)
}

generateFiles(catalogue)
