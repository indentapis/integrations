import { BaseHttpIntegration, BaseHttpResponse } from '@indent/base-integration'
import { Resource, Status } from '@indent/types'
import { AxiosRequestConfig } from 'axios'
import { getToken } from './okta-auth'

export async function callOktaAPI(
  scope: BaseHttpIntegration,
  {
    method,
    url,
    data,
    transform,
    scope: tokenScope,
  }: AxiosRequestConfig & {
    transform?: (props: any) => Resource
    scope: string
  }
): Promise<{
  status: Status
  response: BaseHttpResponse
}> {
  // Required for all authentication
  const OKTA_DOMAIN = process.env.OKTA_DOMAIN || ''

  const { Authorization } = await getToken(tokenScope)
  const baseURL = /http/.test(OKTA_DOMAIN)
    ? OKTA_DOMAIN
    : `https://${OKTA_DOMAIN}`
  const response = await scope.Fetch({
    baseURL,
    method,
    url,
    headers: {
      Authorization,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },

    // Optional request payload data
    data,
  })
  let { status: statusCode, headers, data: resData } = response
  const oktaRateLimitMax = parseInt(
    String(headers['x-rate-limit-limit'] || '1'),
    10
  )
  const oktaRateLimitRemaining = parseInt(
    String(headers['x-rate-limit-remaining'] || '1'),
    10
  )
  const oktaRateLimitReset = new Date(0)
  oktaRateLimitReset.setUTCSeconds(
    parseInt(headers['x-rate-limit-reset'] || '0', 10)
  )
  console.log(
    `  → ${oktaRateLimitRemaining} / ${oktaRateLimitMax} requests to Okta left ${oktaRateLimitReset ? `until ${oktaRateLimitReset.toLocaleString()}` : ''
    }`
  )

  // If less than 20% left, wait a minute
  if ((oktaRateLimitRemaining / oktaRateLimitMax) * 100 < 20) {
    await new Promise((r) => setTimeout(r, 60 * 1000))
  }

  // TODO: Use linkInfo to auto-paginate
  const linkInfo = parseLinkHeader(headers.link)

  console.log('@indent/okta-webhook: linkInfo')
  console.log({ linkInfo })

  if (linkInfo.next) {
    const { response } = await callOktaAPI(scope, {
      method: 'get',
      scope: tokenScope,
      url: linkInfo.next.replace(baseURL, ''),
    })
    if (response.data) {
      resData = resData.concat(response.data)
    }
  }

  if (resData && transform) {
    resData = resData.map(transform)
  }

  return {
    status: {},
    response: {
      statusCode,
      headers,
      body: JSON.stringify(resData),
      data: resData,
    },
  }
}

function parseLinkHeader(s: string): { next?: string } {
  const output: Record<string, string> = {}
  const regex = /<([^>]+)>; rel="([^"]+)"/g
  let m: RegExpExecArray | null
  while ((m = regex.exec(s))) {
    const [, v, k] = m
    output[k] = v
  }
  return output
}
