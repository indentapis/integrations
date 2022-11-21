import { BaseIntegration, handleRequest } from '@indent/base-integration'
import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'

import { default as axios } from 'axios'

export function getLambdaHandler({
  integrations,
}: {
  integrations: BaseIntegration[]
}): APIGatewayProxyHandler {
  const handler: APIGatewayProxyHandler = async (
    event
  ): Promise<APIGatewayProxyResult> => {
    const { headers, multiValueHeaders, body } = event

    await loadSecrets(integrations) // TODO: not here

    console.log("webhook secret: ", process.env.INDENT_WEBHOOK_SECRET)
    const { response } = await handleRequest(
      {
        body: body || '',
        headers: { ...headers, ...multiValueHeaders },
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

async function getSecret(secretName) {
  switch (process.env.SECRETS_BACKEND) {
    case "aws-secrets-manager": {
      // for Secrets Manager, multiple secret values can be stored in one AWS Secret.
      // When using Secrets Manager, store the AWS Secret name in the env var, and
      // use the integration secret name as a key inside of that.

      if (process.env[secretName] == undefined) {
        // this secret is not in use for this configuration
        // ex: OKTA_TOKEN when using JWK
        return
      }

      // Call the secrets manager sidecar to get the secret
      const res = await axios.get(
        `http://localhost:2773/secretsmanager/get?secretId=${process.env[secretName]}`,
        { headers: { 'X-Aws-Parameters-Secrets-Token': process.env.AWS_SESSION_TOKEN } }
      )
      const awsSecret = JSON.parse(res.data.SecretString)
      console.log("got secret: ", secretName, awsSecret[secretName])
      return awsSecret[secretName]
    }
  }
}

async function loadSecrets(integrations) {
  // gross hack TODO: fix this??
  if (process.env['ALREADY_LOADED'] != undefined) {
    return // already processed
  }
  process.env['ALREADY_LOADED'] = "true"

  const secretNames = integrations.map(i => i.secretNames).flat().filter(Boolean)
  secretNames.push('INDENT_WEBHOOK_SECRET')
  const secrets = await Promise.all(secretNames.map(getSecret))

  const zippedSecrets = secretNames.map((k, i) => [k, secrets[i]])

  zippedSecrets.forEach(secret => {
    process.env[secret[0]] = secret[1]
  })
}
