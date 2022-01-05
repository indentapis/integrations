import { BaseHttpIntegration, BaseHttpResponse } from '@indent/base-webhook'
import { Status } from '@indent/types'
import { AxiosRequestConfig } from 'axios'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN

export async function callGithubAPI(
  scope: BaseHttpIntegration,
  { method, url, data }: AxiosRequestConfig
): Promise<{
  status: Status
  response: BaseHttpResponse
}> {
  const response = await scope.Fetch({
    baseURL: 'https://api.github.com',
    method,
    url,
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    data,
  })

  const { status: statusCode, headers, data: resData } = response

  return {
    status: {},
    response: {
      statusCode,
      headers,
      body: JSON.stringify(resData),
      data: ReadableStreamDefaultReader,
    },
  }
}
