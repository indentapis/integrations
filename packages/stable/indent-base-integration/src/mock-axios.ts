import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

const mocks = {}

export function addMock(config: AxiosRequestConfig, res: AxiosResponse): any {
  const configKey = getConfigKey(config)
  console.log('[MOCK:ADD]', configKey)
  mocks[configKey] = res
  return mocks
}

const getConfigKey = (config: AxiosRequestConfig) =>
  [
    (config.method || 'get').toLowerCase(),
    config.baseURL,
    config.url,
    config.method.toLowerCase() === 'post'
      ? config.url?.includes('tailscale')
        ? // add special case for tailscale ACL formatting
          JSON.stringify(config.data, null, 2)
        : JSON.stringify(config.data)
      : '',
  ]
    .filter(Boolean)
    .join(':')

const isMocked = (config: AxiosRequestConfig) => getConfigKey(config) in mocks

const getMockErrorWithResponse = (config: AxiosRequestConfig) => {
  const mockError: any = new Error()
  mockError.mockData = mocks[getConfigKey(config)]
  mockError.config = config
  return Promise.reject(mockError)
}

const isMockError = (error) => Boolean(error.mockData)

const getMockResponse = (mockError) => {
  const { mockData, config } = mockError
  // Handle mocked error (any non-2xx status code)
  if (mockData.status && String(mockData.status)[0] !== '2') {
    const err: any = new Error(mockData.message || 'mock error')
    err.code = mockData.status
    return Promise.reject(err)
  }

  // Handle mocked success
  return Promise.resolve(
    Object.assign(
      {
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        isMock: true,
      },
      mockData
    )
  )
}

export function attachMockInterceptors(client: AxiosInstance) {
  client.interceptors.request.use(
    (config) => {
      const configKey = getConfigKey(config)
      if (isMocked(config)) {
        console.log('[REQ:MOCK] ' + configKey)
        return getMockErrorWithResponse(config)
      }
      console.log('[REQ] ' + getConfigKey(config))
      return config
    },
    (error) => Promise.reject(error)
  )

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (isMockError(error)) {
        return getMockResponse(error)
      }
      return Promise.reject(error)
    }
  )
}
