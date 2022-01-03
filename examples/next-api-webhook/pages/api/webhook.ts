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

  console.log({
    status,
    response,
  })

  // res.writeHead(response.statusCode, response.headers)
  res.end(response.body)
  // res.end()
}
