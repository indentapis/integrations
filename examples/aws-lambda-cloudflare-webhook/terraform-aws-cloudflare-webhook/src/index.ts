import { getLambdaHandler } from '@indent/runtime-aws'
import { CloudflareIntegration } from './integration'

export const handle = getLambdaHandler({
  integrations: [new CloudflareIntegration()],
})
