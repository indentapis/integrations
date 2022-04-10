import { OpsgenieDecisionIntegration } from '@indent/integration-opsgenie'
import { getLambdaHandler } from '@indent/runtime-aws-lambda'

export const handle = getLambdaHandler({
  integrations: [new OpsgenieDecisionIntegration()],
})
