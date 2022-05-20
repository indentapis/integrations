import { TerraformGenerator } from 'terraform-generator'
import * as data from './catalog.json'

const outputDir = process.cwd()

const generateTfVars = (tfVars: string[]) => {
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
  for (let v = 0; v < tfVars.length; v += 1) {
    tfg.variable(`${tfVars[v]}`, {
      type: 'string',
      default: '',
      sensitive: true,
    })
  }

  tfg.write({ dir: outputDir, format: true, tfFilename: 'variables' })
}

const generateTfOutput = (moduleName: string) => {
  const tfg = new TerraformGenerator()

  tfg.output(moduleName, {
    value: `module.${moduleName}.function_url`,
    description: 'The URL of the deployed Lambda',
  })

  tfg.write({ dir: outputDir, format: true, tfFilename: 'outputs' })
}

const generateTfMain = ({
  name,
  webhookModuleName,
  source,
  bucket,
  functionKey,
  depsKey,
}: // envVars,
{
  name: string
  webhookModuleName
  source: string
  bucket: string
  functionKey: string
  depsKey: string
  // envVars: any[]
}) => {
  const tfg = new TerraformGenerator({
    backend: {
      encrypt: true,
      bucket,
      region: 'us-west-2',
      key: 'indent/terraform.tfstate',
    },
  })

  tfg.module(webhookModuleName, {
    source,
    name: webhookModuleName,
    indent_webhook_secret: 'var.indent_webhook_secret',
    artifact: {
      bucket,
      functionKey,
      depsKey,
    },
  })

  tfg.write({ dir: outputDir, format: true, tfFilename: 'main' })
}
