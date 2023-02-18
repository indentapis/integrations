import { OktaGroupIntegration, OktaUserIntegration } from '@indent/integration-okta'
import { getLambdaHandler } from '@indent/runtime-aws-lambda'

export const handle = getLambdaHandler({
  integrations: [new OktaGroupIntegration(), new OktaUserIntegration()],
})
