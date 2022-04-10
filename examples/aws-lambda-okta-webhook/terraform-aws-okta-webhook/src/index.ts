import { OktaGroupIntegration, OktaUserIntegration } from '@indent/okta-webhook'
import { getLambdaHandler } from '@indent/runtime-aws'

export const handle = getLambdaHandler({
  integrations: [new OktaGroupIntegration(), new OktaUserIntegration()],
})
