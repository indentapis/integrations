import { TailscaleGroupIntegration } from '@indent/integration-tailscale'
import { getLambdaHandler } from '@indent/runtime-aws-lambda'

export const handle = getLambdaHandler({
  integrations: [new TailscaleGroupIntegration()],
})
