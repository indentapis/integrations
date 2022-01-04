import { OktaGroupIntegration } from '@indent/okta-webhook'
import { getLambdaHandler } from '@indent/provider-aws'

export default getLambdaHandler({
  integrations: [new OktaGroupIntegration()],
})
