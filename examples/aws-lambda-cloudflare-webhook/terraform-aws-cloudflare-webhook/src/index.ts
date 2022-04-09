import { getLambdaHandler } from '@indent/provider-aws'
import { CloudflareIntegration } from './integration'

export const handle = getLambdaHandler({
  integrations: [new CloudflareIntegration()],
})
