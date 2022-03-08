import { OktaGroupIntegration } from '@indent/okta-webhook'
import { getLambdaHandler } from '@indent/provider-aws'

export const handle = getLambdaHandler({
  integrations: [new OktaGroupIntegration()],
})
