import { getLambdaHandler } from '@indent/provider-aws'
import { TailscaleIntegration } from '@indent/tailscale-webhook'

export const handle = getLambdaHandler({
  integrations: [new TailscaleIntegration()],
})
