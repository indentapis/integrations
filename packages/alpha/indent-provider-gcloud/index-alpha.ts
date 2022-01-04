import { BaseIntegration } from '@indent/base-webhook'

export function getFunctionHandler({
  integrations,
}: {
  integrations: BaseIntegration[]
}) {
  return () => {}
  const handler = async (event): Promise<> => {
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
