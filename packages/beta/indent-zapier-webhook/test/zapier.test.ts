import { addMock } from '@indent/base-webhook'
import { ZapierIntegration } from '..'

describe('ZapierIntegration', () => {
  describe('Base functionality', () => {
    it('should respond with a valid health check', () => {
      const integration = new ZapierIntegration()
      const res = integration.HealthCheck()
      expect(res.status.code).toBe(0)
    })

    it('should respond with a valid integration info', () => {
      const integration = new ZapierIntegration()
      const res = integration.GetInfo()
      expect(res.name).toBe('indent-zapier-webhook')
    })
  })

  const resourcePair = [
    {
      kind: 'user',
      id: 'u123',
      labels: {
        'github/id': 'octocat',
      },
    },
    {
      kind: 'github.v1.Team',
      id: 'g123',
      labels: {
        'github/slug': '1',
        'github/org': 'example',
      },
    },
  ]

  describe('ApplyUpdate', () => {
    beforeEach(() => setupMocks())

    describe('access/grant', () => {
      it("should respond with success when sending 'access\\grant' to Zapier (from mock)", () => {
        const integration = new ZapierIntegration()
        return integration
          .ApplyUpdate({
            events: [{ event: 'access/grant', resources: resourcePair }],
          })
          .then((res) => expect(res.status).toEqual({}))
      })
    })

    describe('access/revoke', () => {
      it("should respond with success code when sending 'access\\revoke' to Zapier (from mock)", () => {
        const integration = new ZapierIntegration()
        return integration
          .ApplyUpdate({
            events: [{ event: 'access/revoke', resources: resourcePair }],
          })
          .then((res) => expect(res.status).toEqual({}))
      })
    })
  })
})

function setupMocks() {
  addMock(
    {
      method: 'post',
      baseURL: 'https://hooks.zapier.com/hooks/catch',
      url: '/12345678/abcdef0/',
    },
    {
      status: 200,
      statusText: '200',
      headers: {},
      data: {
        url: 'https://hooks.zapier.com/hooks/catch/12345678/abcdef0/',
      },
      config: {},
    }
  )
}
