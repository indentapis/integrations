import { writeFile } from 'fs/promises'
import { catalogue } from './catalog'

const currentItem = catalogue.filter((item) =>
  process.env.WEBHOOK_DIR.toLowerCase().includes(item.name)
)

const { integrations, name } = currentItem[0]

const currentIntegration = `import { ${integrations.join(
  ', '
)}} from '@indent/integration-${name}'\nimport { getLambdaHandler } from '@indent/runtime-aws-lambda'\n\nexport const handle = getLambdaHandler({\n  integrations: [${integrations
  .map((i) => `new ${i}()`)
  .join(', ')}],\n})`

const writeIntegration = async () =>
  await writeFile('./index.ts', currentIntegration)

writeIntegration()
