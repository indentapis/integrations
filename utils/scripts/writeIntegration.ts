import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { catalogue } from './catalog'

const currentItem = catalogue.filter((item) =>
  process.env.WEBHOOK_DIR.toLowerCase().includes(item.name)
)

const path = join(process.env.WEBHOOK_DIR, 'src', 'index.ts')

const { integrations, name } = currentItem[0]

const writeIntegration = async ({
  functionNames,
  integrationName,
  path,
}: {
  functionNames: string[]
  integrationName: string
  path: string
}) => {
  try {
    const data = await await readFile(path, 'utf8')
    const newIntegration = data
      .replace('ExampleIntegration', functionNames.join(', '))
      .replace(
        '@indent/integration-example',
        `@indent/integration-${integrationName}`
      )
      .replace(
        '[new ExampleIntegration()]',
        `[${functionNames.map((i) => `new ${i}()`).join(', ')}]`
      )
    await writeFile(path, newIntegration, 'utf8')
  } catch (err) {
    console.log(err)
  }
}

writeIntegration({ functionNames: integrations, integrationName: name, path })
