import {
  BaseIntegration,
  handleRequest,
  StatusCode,
} from '@indent/base-integration'
import { APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import axios from 'axios'

export function getLambdaHandler({
  integrations,
}: {
  integrations: BaseIntegration[]
}): APIGatewayProxyHandler {
  const handler: APIGatewayProxyHandler = async (
    event
  ): Promise<APIGatewayProxyResult> => {
    try {
      await loadSecrets(integrations)
      const { headers, multiValueHeaders, body } = event
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
    } catch (err) {
      const body = JSON.stringify({
        status: {
          code: StatusCode.UNKNOWN,
          message: err.toString(),
        },
      })
      return {
        body,
        headers: { 'Content-Type': 'application/json' },
        statusCode: 500,
      }
    }
  }

  return handler
}

async function getSecret(secretName) {
  switch (process.env.SECRETS_BACKEND) {
    case 'aws-secrets-manager': {
      // for Secrets Manager, multiple secret values can be stored in one AWS Secret.
      // When using Secrets Manager, store the AWS Secret name in the env var, and
      // use the integration secret name as a key inside of that.

      if (!process.env[secretName]) {
        // if using backend, secretName should be set to secretId
        // this secret is not in use for this configuration
        // ex: OKTA_TOKEN when using JWK
        return
      }

      // Call the secrets manager sidecar to get the secret
      const res = await axios.get(
        `http://localhost:2773/secretsmanager/get?secretId=${process.env[secretName]}`,
        {
          headers: {
            'X-Aws-Parameters-Secrets-Token': process.env.AWS_SESSION_TOKEN,
          },
        }
      )
      const awsSecret = JSON.parse(res.data.SecretString)
      return awsSecret[secretName]
    }
  }
}

let hasLoadedSecrets: boolean = false

async function loadSecrets(integrations) {
  if (hasLoadedSecrets) {
    return
  }

  hasLoadedSecrets = true

  const secretNames = [...integrations, 'INDENT_WEBHOOK_SECRET']
    .map((i) => i.secretNames || [])
    .flat()
    .filter(Boolean)
    .filter(uniq)

  const secrets = await Promise.all(secretNames.map(getSecret))

  const zippedSecrets = secretNames.map((k, i) => [k, secrets[i]])

  zippedSecrets.forEach((secret) => {
    process.env[secret[0]] = secret[1]
  })
}

function uniq(value: any, index: any, self: any) {
  return self.indexOf(value) === index
}
