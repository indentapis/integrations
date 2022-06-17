import { readFile, writeFile } from 'fs/promises'
import { CatalogItem } from '..'

export default async function writeIntegration(item: CatalogItem, path) {
  try {
    const data = await readFile(path + '/src/index.example.ts', 'utf8')
    const { integrations, name } = item
    const newIntegration = data
      .replace('ExampleIntegration', integrations.join(', '))
      .replace('@indent/integration-example', `@indent/integration-${name}`)
      .replace(
        '[new ExampleIntegration()]',
        `[${integrations.map((i) => `new ${i}()`).join(', ')}]`
      )
    await writeFile(path + '/src/index.ts', newIntegration, 'utf8')
  } catch (err) {
    console.log(err)
  }
}
