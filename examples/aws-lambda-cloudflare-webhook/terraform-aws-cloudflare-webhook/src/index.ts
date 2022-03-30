import { getLambdaHandler } from '@indent/provider-aws'
import { CloudflareIntegration } from '../../../../packages/beta/indent-cloudflare-webhook'

export const handle = getLambdaHandler({
  integrations: [new CloudflareIntegration()],
})
