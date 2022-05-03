import { getLambdaHandler } from '@indent/runtime-aws-lambda'
import { TailscaleIntegration } from '@indent/integration-tailscale'

export const handle = getLambdaHandler({
  integrations: [new TailscaleIntegration()],
})
