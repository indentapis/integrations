import { addMock } from '@indent/base-integration'
import { TwingateGroupIntegration } from '../src'

const TWINGATE_API_KEY = process.env.TWINGATE_API_KEY || ''
const NETWORK = process.env.TWINGATE_NETWORK || ''

describe.skip('TwingateGroupIntegration', () => {
  describe('Base functionality', () => {
    it('should respond with a valid health check', () => {
      const integration = new TwingateGroupIntegration()
      const res = integration.HealthCheck()
      expect(res.status).toStrictEqual({})
    })

    it('should respond with a valid integration info', () => {
      const integration = new TwingateGroupIntegration()
      const res = integration.GetInfo()
      expect(res.name).toBe('indent-integration-twingate')
    })
  })

  const resourcePair = [
    {
      kind: 'user',
      id: 'user1234',
      email: 'user1234@example.com',
    },
    {
      kind: 'twingate.v1.Group',
      id: 'group:example',
      labels: {
        'twingate/network': 'rainbow',
      },
    },
  ]

  describe('ApplyUpdate', () => {
    beforeEach(() => setupMocks())
    describe('access/grant', () => {
      it('should respond with success (from mock)', () => {
        const integration = new TwingateGroupIntegration()
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
        const integration = new TwingateGroupIntegration()
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
})

function setupMocks() {
  addMock(
    {
      method: 'get',
      baseURL: 'https://api.twingate.com/api/v2',
      url: `/network/${NETWORK}/acl`,
    },
    {
      config: {},
      headers: {},
      status: 200,
      statusText: '200',
      data: {
        acls: [
          {
            action: 'accept',
            users: ['*'],
            ports: ['*:*'],
          },
        ],
        groups: {
          'group:example': ['user5678@example.com'],
        },
        hosts: {
          'example-host-1': '100.100.100.100',
        },
      },
    }
  )
  addMock(
    {
      method: 'post',
      baseURL: 'https://api.twingate.com/api/v2',
      url: `/network/${NETWORK}/acl`,
    },
    {
      config: {},
      headers: {},
      status: 201,
      statusText: '201',
      data: null,
    }
  )
}
