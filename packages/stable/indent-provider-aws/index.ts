import { BaseIntegration, handleRequest } from '@indent/base-webhook'
import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

export function getLambdaHandler({
  integrations,
}: {
  integrations: BaseIntegration[]
}): APIGatewayProxyHandler {
  const handler: APIGatewayProxyHandler = async (
    event
  ): Promise<APIGatewayProxyResult> => {
    const { headers, multiValueHeaders, body } = event
    let { status, response } = await handleRequest({
      body: body || '',
      headers: { ...headers, ...multiValueHeaders },
      secret: process.env.INDENT_WEBHOOK_SECRET || '',
    })

    if (status.code !== 0) {
      // handle error reporting for lambda
    }

    if (!response) {
      response = {
        statusCode: status.code === 0 ? 200 : 500,
        body: JSON.stringify({ status }),
        headers: { 'Content-Type': 'application/json' },
      }
    }

    return {
      body: response.body,
      headers: response.headers as {
        [header: string]: string | number | boolean
      },
      statusCode: response.statusCode,
    }
  }

  return handler
}
