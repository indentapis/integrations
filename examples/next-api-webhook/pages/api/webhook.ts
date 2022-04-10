import { AutoRejectIntegration } from '@indent/dummy-webhook'
import { ExampleIntegration } from '@indent/integration-example'
import { getNextHandler } from '@indent/runtime-next'

export default getNextHandler({
  integrations: [
    new ExampleIntegration(),
    new AutoRejectIntegration({
      name: 'special-instance',
    }),
  ],
})
