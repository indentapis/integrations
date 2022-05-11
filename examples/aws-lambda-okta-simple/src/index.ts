import { OktaGroupIntegration, OktaUserIntegration } from '@indent/okta-webhook'
import { getLambdaHandler } from '@indent/runtime-aws-lambda'

export const handle = getLambdaHandler({
  integrations: [new OktaGroupIntegration(), new OktaUserIntegration()],
})
