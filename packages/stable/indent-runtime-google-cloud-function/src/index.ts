import { BaseIntegration, handleRequest } from '@indent/base-integration'
import { Request } from 'express'

type IRequest = Request & { rawBody: string }

export function getGoogleHandler({
  integrations,
}: {
  integrations: BaseIntegration[]
}) {
  const handler = async function (req: IRequest) {
    const { headers, rawBody } = req

    const { response } = await handleRequest(
      {
        body: rawBody.toString() || '',
        headers: { ...headers },
        secret: process.env.INDENT_WEBHOOK_SECRET || '',
      },
      ...integrations
    )

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
