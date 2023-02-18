import { addMock } from '@indent/base-integration'
import { OktaProfileIntegration } from '../lib'

const OKTA_DOMAIN = process.env.OKTA_DOMAIN || ''

describe('OktaProfileIntegration', () => {
  describe('Base functionality', () => {
    it('should respond with a valid health check', () => {
      const integration = new OktaProfileIntegration()
      const res = integration.HealthCheck()
      expect(res.status.code).toEqual(0)
    })

    it('should respond with a valid integration info', () => {
      const integration = new OktaProfileIntegration()
      const res = integration.GetInfo()
      expect(res.name).toBe('indent-okta-profile-webhook')
    })
  })

  const resourcePair = [
    {
      kind: 'user',
      id: '00ub0oNGTSWTBKOLGLNR',
      labels: {
        'okta/userProfileAttribute/id': 'customer_id',
        'okta/userProfileAttribute/value': 'C123456',
        oktaId: '00ub0oNGTSWTBKOLGLNR',
      },
    },
    {
      kind: 'ProfileAttribute',
      id: 'C123456',
      labels: {
        'okta/userProfileAttribute/id': 'customer_id',
        'okta/userProfileAttribute/value': 'C123456',
      },
    },
  ]

  describe.skip('ApplyUpdate', () => {
    beforeEach(() => setupMocks())

    describe('access/grant', () => {
      it('should respond with success (from mock)', () => {
        const integration = new OktaProfileIntegration()
        return integration
          .ApplyUpdate({
            events: [
              {
                event: 'access/grant',
                resources: resourcePair,
              },
            ],
          })
          .then((res) => console.log(res))
      })
    })

    describe('access/revoke', () => {
      it('should respond with success (from mock)', () => {
        const integration = new OktaProfileIntegration()
        return integration
          .ApplyUpdate({
            events: [
              {
                event: 'access/revoke',
                resources: resourcePair,
              },
            ],
          })
          .then((res) => console.log(res))
      })
    })
  })
})

function setupMocks() {
  addMock(
    {
      method: 'GET',
      url: '/api/v1/users/00ub0oNGTSWTBKOLGLNR',
      baseURL: `https://${OKTA_DOMAIN}`,
    },
    {
      config: {},
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      status: 200,
      statusText: '200',
      data: {
        id: '00ub0oNGTSWTBKOLGLNR',
        profile: {
          firstName: 'Isaac',
          lastName: 'Brock',
          email: 'isaac.brock@example.com',
          login: 'isaac.brock@example.com',
          mobilePhone: '555-415-1337',
          customer_id: ['C123456'],
        },
      },
    }
  )
  addMock(
    {
      method: 'POST',
      url: '/api/v1/users/00ub0oNGTSWTBKOLGLNR',
      baseURL: `https://${OKTA_DOMAIN}`,
    },
    {
      config: {},
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      status: 201,
      statusText: '201',
      data: null,
    }
  )
}
