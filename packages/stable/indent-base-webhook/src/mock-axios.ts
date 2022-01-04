import { AxiosInstance, AxiosRequestConfig } from 'axios'

const mocks = {}

export function addMock(url, data) {
  mocks[url] = data
}

const getConfigKey = (config: AxiosRequestConfig) =>
  [config.method, config.baseURL, config.url].join(':')

const isMocked = (config: AxiosRequestConfig) => getConfigKey(config) in mocks

const getMockError = (config: AxiosRequestConfig) => {
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
      if (isMocked(config)) {
        console.log('[REQ:MOCK]' + config.url)
        return getMockError(config)
      }
      console.log('[REQ]' + config.url)
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
