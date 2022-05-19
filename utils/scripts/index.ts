import { TerraformGenerator } from 'terraform-generator'

const writeTerraformVariables = (varNames: string[]) => {
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
  for (let v = 0; v < varNames.length; v += 1) {
    tfg.variable(`${varNames[v]}`, {
      type: 'string',
      default: '',
      sensitive: true,
    })
  }

  const outputDir = process.cwd()
  tfg.write({ dir: outputDir, format: true, tfFilename: 'variables' })
}

const writeTerraformOutput = (moduleName: string) => {
  const tfg = new TerraformGenerator()

  tfg.output(moduleName, {
    value: `module.${moduleName}.function_url`,
    description: 'The URL of the deployed Lambda',
  })

  const outputDir = process.cwd()
  tfg.write({ dir: outputDir, format: true, tfFilename: 'outputs' })
}

const writeTerraformMain = ({
  name,
  source,
  bucket,
  function_key,
  deps_key,
}: // envVars,
{
  name: string
  source: string
  bucket: string
  function_key: string
  deps_key: string
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

  tfg.module(name, {
    source,
    name,
    indent_webhook_secret: tfg.variable('indent_webhook_secret'),
    artifact: {
      bucket,
      function_key,
      deps_key,
    }
  })

  const outputDir = process.cwd()
  tfg.write({ dir: outputDir, format: true, tfFilename: 'main' })
}

writeTerraformVariables(['pagerduty_key'])
writeTerraformOutput('pagerduty_auto_approval_webhook')
writeTerraformMain({
  name: 'example-webhook',
  source:
    'git::https://github.com/indentapis/integrations//terraform/modules/indent_runtime_aws_lambda',
  bucket: 'indent-artifacts-us-west-2',
  function_key: 'webhooks/aws/lambda/example-v0.0.1-canary-function.zip',
  deps_key: 'webhooks/aws/lambda/example-v0.0.1-canary-deps.zip',
  // envVars: [{ PAGERDUTY_KEY: 'var.pagerduty_key' }],
})
