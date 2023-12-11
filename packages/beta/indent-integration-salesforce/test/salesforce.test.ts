import { HealthCheckResponse } from '@indent/base-integration'
import {
  ApplyUpdateResponse,
  PullUpdateResponse,
  Resource,
} from '@indent/types'
import jsforce from 'jsforce'
import { SalesforceIntegration } from '../src'
import {
  SalesforceUserInfoResponse,
  SalesforceUserRolesResponse,
} from '../src/salesforce-types'

jest.mock('jsforce', () => {
  const originalJsForce = jest.requireActual('jsforce')
  return {
    ...originalJsForce,
    Connection: jest.fn().mockImplementation(() => ({
      query: jest.fn(),
      sobject: (_objName) => ({
        update: jest.fn(),
      }),
    })),
  }
})

describe('SalesforceIntegration', () => {
  let salesforceIntegration: SalesforceIntegration
  let mockConnection: any

  beforeEach(() => {
    mockConnection = new jsforce.Connection()
    salesforceIntegration = new SalesforceIntegration()
    salesforceIntegration._conn = mockConnection
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

  describe('PullUpdate', () => {
    it('should return resources for salesforce.v1.userrole and salesforce.v1.user', async () => {
      const pullUpdateRequest = {
        kinds: ['salesforce.v1.userRole', 'salesforce.v1.user'],
      }

      const expectedResources: Resource[] = [
        // Mocked resources for 'salesforce.v1.userrole'
        {
          id: 'roleId1',
          displayName: 'Role 1',
          kind: 'salesforce.v1.userRole',
          labels: {
            description: 'Role 1',
            timestamp: expect.any(String),
          },
        },
        // Mocked resources for 'salesforce.v1.user'
        {
          id: 'userId1',
          displayName: 'User 1',
          kind: 'salesforce.v1.user',
          labels: {
            description: 'User 1',
            timestamp: expect.any(String),
            'salesforce/isActive': 'true',
            'salesforce/role': null,
            'salesforce/userLicense': null,
          },
        },
      ]

      const userRolesResponse: SalesforceUserRolesResponse = {
        totalSize: 1,
        done: true,
        records: [
          {
            attributes: {
              type: 'string',
              url: 'string',
            },
            Id: 'roleId1',
            Name: 'Role 1',
          },
        ],
      }

      const userInfoResponse: SalesforceUserInfoResponse = {
        totalSize: 1,
        done: true,
        records: [
          {
            attributes: {
              type: 'string',
              url: 'string',
            },
            Id: 'userId1',
            Name: 'User 1',
            IsActive: true,
            UserRole: null,
            Profile: null,
          },
        ],
      }

      salesforceIntegration._conn.query
        .mockResolvedValueOnce(userRolesResponse)
        .mockResolvedValueOnce(userInfoResponse)

      const response: PullUpdateResponse =
        await salesforceIntegration.PullUpdate(pullUpdateRequest)

      expect(response.resources).toStrictEqual(expectedResources)
    })
  })

  describe('ApplyUpdate', () => {
    it('should grant access for salesforce.v1.userrole and activate/deactivate users for salesforce.v1.user', async () => {
      const applyUpdateRequest = {
        events: [
          {
            event: 'access/grant',
            resources: [
              {
                id: 'userId1',
                kind: 'salesforce.v1.user',
              },
            ],
          },
          {
            event: 'access/revoke',
            resources: [
              {
                id: 'userId2',
                kind: 'salesforce.v1.user',
              },
            ],
          },
        ],
      }

      const expectedApplyUpdateResponse: ApplyUpdateResponse = {
        status: {
          code: 0,
          message: '',
        },
      }

      const userRolesResponse: SalesforceUserRolesResponse = {
        totalSize: 1,
        done: true,
        records: [
          {
            attributes: {
              type: 'string',
              url: 'string',
            },
            Id: 'roleId1',
            Name: 'Role 1',
          },
        ],
      }

      mockConnection.query.mockResolvedValueOnce(userRolesResponse)

      const response: ApplyUpdateResponse =
        await salesforceIntegration.ApplyUpdate(applyUpdateRequest)

      expect(response).toStrictEqual(expectedApplyUpdateResponse)
    })
  })
})
