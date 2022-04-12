import { addMock } from '@indent/base-integration'
import { TailscaleGroupIntegration } from '../src'

const TAILSCALE_API_KEY = process.env.TAILSCALE_API_KEY || ''
const TAILNET = process.env.TAILSCALE_TAILNET || ''

describe('TailscaleGroupIntegration', () => {
  describe('Base functionality', () => {
    it('should respond with a valid health check', () => {
      const integration = new TailscaleGroupIntegration()
      const res = integration.HealthCheck()
      expect(res.status).toStrictEqual({})
    })

    it('should respond with a valid integration info', () => {
      const integration = new TailscaleGroupIntegration()
      const res = integration.GetInfo()
      expect(res.name).toBe('indent-integration-tailscale')
    })
  })

  const resourcePair = [
    {
      kind: 'user',
      id: 'user1234',
      email: 'user1234@example.com',
    },
    {
      kind: 'tailscale.v1.Group',
      id: 'group:example',
      labels: {
        'tailscale/tailnet': 'example-tailnet',
      },
    },
  ]

  describe('ApplyUpdate', () => {
    beforeEach(() => setupMocks())
    describe('access/grant', () => {
      it('should respond with success (from mock)', () => {
        const integration = new TailscaleGroupIntegration()
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
        const integration = new TailscaleGroupIntegration()
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
      baseURL: 'https://api.tailscale.com/api/v2',
      url: `/tailnet/${TAILNET}/acl`,
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
      baseURL: 'https://api.tailscale.com/api/v2',
      url: `/tailnet/${TAILNET}/acl`,
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
