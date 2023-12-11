import { HealthCheckResponse } from '@indent/base-integration'
import jsforce from 'jsforce'
import { SalesforceIntegration } from '../src'

jest.mock('jsforce')

describe('SalesforceIntegration', () => {
  let salesforceIntegration: SalesforceIntegration
  let mockConnection: any

  beforeEach(() => {
    mockConnection = new jsforce.Connection()
    salesforceIntegration = new SalesforceIntegration()
    salesforceIntegration.conn = mockConnection
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('HealthCheck', () => {
    it('should return a health check response', () => {
      const response: HealthCheckResponse = salesforceIntegration.HealthCheck()
      expect(response.status.code).toBe(0)
    })
  })

  describe('GetInfo', () => {
    it('should return integration information', () => {
      const response = salesforceIntegration.GetInfo()
      expect(response.name).toEqual(expect.any(String))
      expect(response.capabilities).toEqual(['ApplyUpdate', 'PullUpdate'])
      expect(response.version).toEqual(expect.any(String))
    })
  })
})
