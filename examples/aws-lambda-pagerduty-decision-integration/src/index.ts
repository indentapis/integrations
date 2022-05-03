import { PagerdutyDecisionIntegration } from '@indent/integration-pagerduty'
import { getLambdaHandler } from '@indent/runtime-aws'

export const handle = getLambdaHandler({
  integrations: [new PagerdutyDecisionIntegration()],
})
