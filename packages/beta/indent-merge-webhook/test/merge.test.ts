import { addMock } from '@indent/base-webhook'
import { MergeIntegration, MERGE_API_HOST } from '..'

function setupMergeMocks() {
  addMock(
    {
      method: 'get',
      url: '/employees',
      baseURL: MERGE_API_HOST,
    },
    {
      status: 200,
      statusText: '200',
      headers: {},
      data: {
        results: [
          {
            id: 'example-123',
            display_full_name: 'Example User',
            work_email: 'user@example.com',
            manager: 'manager@example.com',
          },
        ],
      },
      config: {},
    }
  )
}

describe('MergeIntegration', () => {
  describe('Base functionality', () => {
    it('should respond with a valid health check', () => {
      const integration = new MergeIntegration()
      const res = integration.HealthCheck()
      expect(res.status.code).toBe(0)
    })

    it('should respond with a valid integration info', () => {
      const integration = new MergeIntegration()
      const res = integration.GetInfo()
      expect(res.name).toBe('indent-merge-webhook')
    })
  })

  describe('PullUpdate', () => {
    beforeEach(() => setupMergeMocks())

    it('should not match for unrelated kinds', () => {
      const integration = new MergeIntegration()
      expect(integration.MatchPull({ kinds: ['random-kind'] })).toBeFalsy()
    })

    it('should respond with a list of 1 resources (from mock)', () => {
      const integration = new MergeIntegration()
      return integration
        .PullUpdate({ kinds: ['merge.v1.Employee'] })
        .then((res) => expect(res.resources).toHaveLength(1))
    })
  })
})
