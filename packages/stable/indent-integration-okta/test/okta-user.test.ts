import { addMock } from '@indent/base-integration'
import { OktaUserIntegration } from '../lib'

const OKTA_DOMAIN = process.env.OKTA_DOMAIN || ''

describe('OktaUserIntegration', () => {
  describe('Base functionality', () => {
    it('should respond with a valid health check', () => {
      const integration = new OktaUserIntegration()
      const res = integration.HealthCheck()
      expect(res.status).toStrictEqual({})
    })

    it('should respond with a valid integration info', () => {
      const integration = new OktaUserIntegration()
      const res = integration.GetInfo()
      expect(res.name).toBe('indent-okta-users-webhook')
    })
  })

  describe('PullUpdate', () => {
    beforeEach(() => setupMocks())

    it('should respond with a list of 2 resources (paginated from mock)', () => {
      const integration = new OktaUserIntegration()
      return integration.PullUpdate({ kinds: ['okta.v1.User'] }).then((res) =>
        expect(res.resources).toStrictEqual([
          {
            displayName: 'Example User',
            email: 'user@example.com',
            id: 'okta.example.com/users/0123',
            kind: 'okta.v1.User',
            labels: {
              oktaId: '0123',
              managerId: 'm123',
              timestamp: res.resources[0].labels.timestamp,
            },
          },
          {
            displayName: 'Example User2',
            email: 'user2@example.com',
            id: 'okta.example.com/users/2345',
            kind: 'okta.v1.User',
            labels: {
              oktaId: '2345',
              managerId: 'm123',
              timestamp: res.resources[0].labels.timestamp,
            },
          },
          {
            displayName: 'Example User',
            email: 'user@example.com',
            kind: 'slack/user',
            labels: {
              managerId: 'm123',
              oktaId: '0123',
              timestamp: res.resources[0].labels.timestamp,
            },
          },
          {
            displayName: 'Example User2',
            email: 'user2@example.com',
            kind: 'slack/user',
            labels: {
              managerId: 'm123',
              oktaId: '2345',
              timestamp: res.resources[0].labels.timestamp,
            },
          },
        ])
      )
    })
  })
})

function setupMocks() {
  addMock(
    {
      method: 'get',
      url: '/api/v1/users',
      baseURL: `https://${OKTA_DOMAIN}`,
    },
    {
      config: {},
      headers: {
        link: `<https://${OKTA_DOMAIN}/api/v1/users?limit=1&after=0123>; rel="next"`,
      },
      status: 200,
      statusText: '200',
      data: [
        {
          id: '0123',
          profile: {
            email: 'user@example.com',
            firstName: 'Example',
            lastName: 'User',
            managerId: 'm123',
          },
        },
      ],
    }
  )
  addMock(
    {
      method: 'get',
      url: '/api/v1/users?limit=1&after=0123',
      baseURL: `https://${OKTA_DOMAIN}`,
    },
    {
      config: {},
      headers: {},
      status: 200,
      statusText: '200',
      data: [
        {
          id: '2345',
          profile: {
            email: 'user2@example.com',
            firstName: 'Example',
            lastName: 'User2',
            managerId: 'm123',
          },
        },
      ],
    }
  )
}
