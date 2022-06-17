import { ExampleIntegration } from '@indent/integration-example'
import { getLambdaHandler } from '@indent/runtime-aws-lambda'

export const handle = getLambdaHandler({
  integrations: [new ExampleIntegration()],
})
