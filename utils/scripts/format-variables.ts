import fsPromises from 'fs/promises'

const myTerraformVariables =
  'variable "pagerduty_key" {\n' +
  '  type      = string\n' +
  '  sensitive = true\n' +
  '  default   = ""\n' +
  '}\n\n'

const writeTerraformVariables = async (additionalVariables: string) => {
  try {
    const defaultVariables =
      'variable "aws_region" {\n' +
      '  type    = string\n' +
      '  default = "us-west-2"\n' +
      '}\n\n' +
      'variable "aws_profile" {\n' +
      '  type    = string\n' +
      '  default = "default"\n' +
      '}\n\n' +
      'variable "indent_webhook_secret" {\n' +
      '  type      = string\n' +
      '  sensitive = true\n' +
      '}\n\n' +
      additionalVariables

    return await fsPromises.writeFile('variables.tf', defaultVariables)
  } catch (err) {
    console.error(err)
  }
}

writeTerraformVariables(myTerraformVariables)
