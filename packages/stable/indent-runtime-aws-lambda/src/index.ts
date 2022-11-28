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
      if (process.env.SECRETS_BACKEND) {
        console.log(`secrets backend: ${process.env.SECRETS_BACKEND}`)
      }
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

async function getSecret(secretName: string): Promise<string> {
  try {
    switch (process.env.SECRETS_BACKEND) {
      case 'aws-secrets-manager': {
        // for Secrets Manager, multiple secret values can be stored in one AWS Secret.
        // When using Secrets Manager, store the AWS Secret name in the env var, and
        // use the integration secret name as a key inside of that.

        if (!process.env[secretName]) {
          // if the secret is not in the process' env vars, ignore it.
          // Not all secrets a given integration supports (and therefore pulls in
          // upon instantiation) are used in all configurations.

          // for example, when configuring the Okta integration to use app/JWKS
          // authentication, the OKTA_TOKEN variable is unused.
          return ''
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
      default:
        return process.env[secretName]
    }
  } catch (err) {
    console.error(err)
    return ''
  }
}

let hasLoadedSecrets: boolean = false

async function loadSecrets(integrations) {
  if (
    hasLoadedSecrets ||
    !process.env.SECRETS_BACKEND ||
    process.env.SECRETS_BACKEND === 'env-var'
  ) {
    return
  }

  hasLoadedSecrets = true

  const secretNames = integrations
    .map((i) => i.secretNames || [])
    .flat()
    .filter(Boolean)
    .filter(uniq)

  secretNames.push('INDENT_WEBHOOK_SECRET')

  const secrets = await Promise.all(secretNames.map(getSecret))

  const zippedSecrets = secretNames.map((k, i) => [k, secrets[i]])

  zippedSecrets.forEach((secret) => {
    if (secret[1]) {
      process.env[secret[0]] = secret[1]
    }
  })
}

function uniq(value: any, index: any, self: any) {
  return self.indexOf(value) === index
}
