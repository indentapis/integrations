import { addMock } from '@indent/base-webhook'
import { OktaGroup, OktaGroupIntegration } from '../lib'

const OKTA_DOMAIN = process.env.OKTA_DOMAIN || ''

describe('OktaGroupIntegration', () => {
  describe('Base functionality', () => {
    it('should respond with a valid health check', () => {
      const integration = new OktaGroupIntegration()
      const res = integration.HealthCheck()
      expect(res.status).toStrictEqual({})
    })

    it('should respond with a valid integration info', () => {
      const integration = new OktaGroupIntegration()
      const res = integration.GetInfo()
      expect(res.name).toBe('indent-okta-groups-webhook')
    })
  })

  const resourcePair = [
    {
      kind: 'user',
      id: 'u123',
    },
    {
      kind: 'group',
      id: 'g123',
    },
  ]

  describe('ApplyUpdate', () => {
    beforeEach(() => setupMocks())

    describe('access/grant', () => {
      it('should respond with success (from mock)', () => {
        const integration = new OktaGroupIntegration()
        return integration
          .ApplyUpdate({
            events: [
              {
                event: 'access/grant',
                resources: resourcePair,
              },
            ],
          })
          .then((res) => expect(res.status).toStrictEqual({}))
      })
    })

    describe('access/revoke', () => {
      it('should respond with success (from mock)', () => {
        const integration = new OktaGroupIntegration()
        return integration
          .ApplyUpdate({
            events: [
              {
                event: 'access/revoke',
                resources: resourcePair,
              },
            ],
          })
          .then((res) => expect(res.status).toStrictEqual({}))
      })
    })
  })

  describe('PullUpdate', () => {
    beforeEach(() => setupMocks())

    it('should respond with a list of 1 resources (from mock)', () => {
      const integration = new OktaGroupIntegration()
      return integration.PullUpdate({ kinds: ['okta.v1.Group'] }).then((res) =>
        expect(res.resources).toStrictEqual([
          {
            id: 'okta.example.com/api/v1/groups/0g123',
            kind: 'okta.v1.Group',
            labels: {
              description: '',
              oktaGroupType: 'OKTA_GROUP',
              oktaId: '0g123',
              timestamp: res.resources[0].labels.timestamp,
            },
          },
        ])
      )
    })
  })
})

function setupMocks() {
  const empty200 = {
    config: {},
    headers: {},
    status: 200,
    statusText: '200',
    data: null,
  }

  addMock(
    {
      method: 'put',
      url: '/api/v1/groups/g123/users/u123',
      baseURL: `https://${OKTA_DOMAIN}`,
    },
    empty200
  )
  addMock(
    {
      method: 'delete',
      url: '/api/v1/groups/g123/users/u123',
      baseURL: `https://${OKTA_DOMAIN}`,
    },
    empty200
  )
  addMock(
    {
      method: 'get',
      url: '/api/v1/groups',
      baseURL: `https://${OKTA_DOMAIN}`,
    },
    {
      config: {},
      headers: {},
      status: 200,
      statusText: '200',
      data: [
        {
          id: '0g123',
          type: 'OKTA_GROUP',
        },
      ] as OktaGroup[],
    }
  )
}
