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
            // FIXME: replace with actual fields
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
          id: '0g123',
          type: 'OKTA_APP',
        },
      ] as OktaApp[],
    }
  )
}
