import { getLambdaHandler } from '@indent/runtime-aws'
import { SalesforceIntegration } from './integration'

export const handle = getLambdaHandler({
  integrations: [new SalesforceIntegration()],
})
