import { AutoRejectIntegration } from '@indent/dummy-webhook'
import { ExampleIntegration } from '@indent/example-webhook/lib/src'
import { getNextHandler } from '@indent/provider-next'

export default getNextHandler({
  integrations: [
    new ExampleIntegration(),
    new AutoRejectIntegration({
      name: 'special-instance',
    }),
  ],
})
