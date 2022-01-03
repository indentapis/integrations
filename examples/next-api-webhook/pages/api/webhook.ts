import { handleRequest } from '@indent/base-webhook'
import { ExampleIntegration } from '@indent/example-webhook'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { status, response } = await handleRequest(
    {
      body: req.body || '{}',
      headers: req.headers,
      secret: process.env.INDENT_WEBHOOK_SECRET || 's123',
    },
    new ExampleIntegration()
  )

  console.log(status)

  Object.keys(response.headers || {}).forEach((header) =>
    res.setHeader(header, response.headers[header])
  )

  res.status(response.statusCode).write(response.body)
  res.end()
}
