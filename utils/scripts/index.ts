import { arg, TerraformGenerator } from 'terraform-generator'
import * as data from './catalog.json'

const outputDir = process.cwd()

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

  tfg.write({ dir: outputDir, format: true, tfFilename: 'variables' })
}

const generateTfOutput = (name: string) => {
  const tfg = new TerraformGenerator()

  tfg.output(`idt-${name}-webhook-url`, {
    value: `module.idt-${name}-webhook-url.function_url`,
    description: 'The URL of the deployed Lambda',
  })

  tfg.write({ dir: outputDir, format: true, tfFilename: 'outputs' })
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

  tfg.write({ dir: outputDir, format: true, tfFilename: 'main' })
}

generateTfMain({
  name: data.name,
  source: data.source,
  envVars: data.environmentVariables,
  artifactBucket: data.artifactBucket,
  functionKey: data.functionKey,
  depsKey: data.depsKey,
})

generateTfOutput(data.name)
generateTfVars(data.environmentVariables)
