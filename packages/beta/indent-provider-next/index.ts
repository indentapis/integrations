import { BaseIntegration, handleRequest } from '@indent/base-webhook'
import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next'

export function getNextHandler({
  integrations,
}: {
  integrations: BaseIntegration[]
}): NextApiHandler {
  const handler: NextApiHandler = async (
    req: NextApiRequest,
    res: NextApiResponse
  ) => {
    const { response } = await handleRequest(
      {
        body: req.body || '{}',
        headers: req.headers,
        secret: process.env.INDENT_WEBHOOK_SECRET || 's123',
      },
      ...integrations
    )

    res.status(response.statusCode || 200).end(response.body)
  }

  return handler
}
