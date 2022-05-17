import fsPromises from 'fs/promises'

const writeTerraformOutput = async (moduleName: string) => {
  try {
    await fsPromises.writeFile(
      'outputs.tf',
      `output \"${moduleName}_url\" {\n` +
        `  value = module.${moduleName}.function_url\n` +
        '  description = "The URL of the deployed Lambda"\n}'
    )
  } catch (err) {
    console.error(err)
  }
}

writeTerraformOutput('pagerduty_auto_approval_webhook')
