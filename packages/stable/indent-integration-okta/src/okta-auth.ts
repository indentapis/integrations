import { default as axios } from 'axios'
import { create, Jwt } from 'njwt'

// Required for all authentication
const OKTA_DOMAIN = process.env.OKTA_DOMAIN || ''

// Service account-based authentication
const OKTA_TOKEN = process.env.OKTA_TOKEN || ''

// App-based auOktaGroupthentication
const OKTA_CLIENT_ID = process.env.OKTA_CLIENT_ID || ''
const OKTA_PRIVATE_KEY = process.env.OKTA_PRIVATE_KEY || ''

type TokenResponse = {
  Authorization: string
  token: string
}

export async function getToken(): Promise<TokenResponse> {
  if (OKTA_TOKEN) {
    return {
      Authorization: `SSWS ${OKTA_TOKEN}`,
      token: OKTA_TOKEN,
    }
  } else if (!OKTA_PRIVATE_KEY) {
    throw new Error('utils/okta-auth: missing env var: OKTA_PRIVATE_KEY')
  }

  const signingToken = await getOktaSigningToken()
  const token = await getOktaAccessToken(signingToken)

  return {
    Authorization: `Bearer ${token}`,
    token,
  }
}

async function getOktaSigningToken(): Promise<string> {
  const claims = {
    iss: `${OKTA_CLIENT_ID}`,
    sub: `${OKTA_CLIENT_ID}`,
    aud: `https://${OKTA_DOMAIN}/oauth2/v1/token`,
  }
  const signingKey = OKTA_PRIVATE_KEY.toString()

  const jwt: Jwt = create(claims, signingKey, 'RS256')
  return jwt.compact()
}

async function getOktaAccessToken(signingToken: string): Promise<string> {
  const urlParams = new URLSearchParams({
    grant_type: 'client_credentials',
    scope: 'okta.groups.manage',
    client_assertion_type:
      'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
    client_assertion: `${signingToken}`, // bearer token
  })
  const res = await axios({
    url: `https://${OKTA_DOMAIN}/oauth2/v1/token`,
    method: 'post',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    data: urlParams,
  }).then((r) => r.data)

  return res.access_token
}
