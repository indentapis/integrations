import {
  AuthenticationResult,
  ConfidentialClientApplication,
} from '@azure/msal-node'

export async function getAzureToken({
  azureTenant,
  azureClientId,
  azureClientSecret,
}: {
  azureTenant: string
  azureClientId: string
  azureClientSecret: string
}): Promise<AuthenticationResult> {
  const clientConfig = {
    auth: {
      clientId: azureClientId,
      authority: `https://login.microsoft.com/${azureTenant}`,
      clientSecret: azureClientSecret
    },
  }

  const cca = new ConfidentialClientApplication(clientConfig)

  const clientCredentialsRequest = {
    scopes: ['https://graph.microsoft.com/.default'],
  }

  return await cca.acquireTokenByClientCredential(clientCredentialsRequest)
}
