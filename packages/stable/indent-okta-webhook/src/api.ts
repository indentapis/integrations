import { BaseHttpResponse } from '@indent/base-webhook'
import { Status } from '@indent/types'
import { AxiosRequestConfig, default as axios } from 'axios'
import { getToken } from './auth'

// Required for all authentication
const OKTA_DOMAIN = process.env.OKTA_DOMAIN || ''

export async function callOktaAPI({
  method,
  url,
  data,
}: AxiosRequestConfig): Promise<{
  status: Status
  response: BaseHttpResponse
}> {
  const { Authorization } = await getToken()
  const response = await axios({
    baseURL: /http/.test(OKTA_DOMAIN) ? OKTA_DOMAIN : `https://${OKTA_DOMAIN}`,
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
  const { status: statusCode, headers, data: resData } = response
  const oktaRateLimitMax = parseInt(
    String(headers['x-rate-limit-limit'] || '1'),
    10
  )
  const oktaRateLimitRemaining = parseInt(
    String(headers['x-rate-limit-remaining'] || '1'),
    10
  )
  const oktaRateLimitReset = new Date(0)
  oktaRateLimitReset.setUTCSeconds(parseInt(headers['x-rate-limit-reset'], 10))
  console.log(
    `  → ${oktaRateLimitRemaining} / ${oktaRateLimitMax} requests to Okta left until ${oktaRateLimitReset.toLocaleString()}`
  )

  // If less than 20% left, wait a minute
  if ((oktaRateLimitRemaining / oktaRateLimitMax) * 100 < 20) {
    await new Promise((r) => setTimeout(r, 60 * 1000))
  }

  const linkInfo = parseLinkHeader(headers.link)

  return {
    status: {},
    response: {
      statusCode,
      headers,
      body: JSON.stringify(resData),
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