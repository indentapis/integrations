import { addMock } from '@indent/base-integration'
import { OktaApp, OktaAppIntegration } from '../lib'

const OKTA_DOMAIN = process.env.OKTA_DOMAIN || ''

describe('OktaAppIntegration', () => {
  describe('Base functionality', () => {
    it('should respond with a valid health check', () => {
      const integration = new OktaAppIntegration()
      const res = integration.HealthCheck()
      expect(res.status).toStrictEqual({ code: 0 })
    })

    it('should respond with a valid integration info', () => {
      const integration = new OktaAppIntegration()
      const res = integration.GetInfo()
      expect(res.name).toBe('indent-okta-apps-webhook')
    })
  })

  describe('PullUpdate', () => {
    beforeEach(() => setupMocks())

    it('should respond with a list of 1 resources (from mock)', () => {
      const integration = new OktaAppIntegration()
      return integration.PullUpdate({ kinds: ['okta.v1.App'] }).then((res) =>
        expect(res.resources).toStrictEqual([
          {
            displayName: 'test_app',
            id: 'okta.example.com/api/v1/apps/0a123',
            kind: 'okta.v1.App',
            labels: {
              'indent.com/profile/avatar':
                'https://indentinc.okta.com/assets/img/logos/default.012345.png',
              oktaId: '0a123',
              oktaLabel: 'Test App',
              oktaName: 'test_app',
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
      method: 'get',
      url: '/api/v1/apps',
      baseURL: `https://${OKTA_DOMAIN}`,
    },
    {
      config: {},
      headers: {},
      status: 200,
      statusText: '200',
      data: [
        {
          id: '0a123',
          name: 'test_app',
          label: 'Test App',
          _links: {
            logo: [
              {
                name: 'medium',
                href: 'https://indentinc.okta.com/assets/img/logos/default.012345.png',
                type: 'image/png',
              },
            ],
            appLinks: [
              {
                name: 'test_app_1_link',
                href: 'https://indentinc.okta.com/home/test_app_1/012345abc/defgh',
                type: 'text/html',
              },
            ],
          },
        },
      ] as OktaApp[],
    }
  )
}
