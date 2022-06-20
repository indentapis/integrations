import { AutoApproveIntegration } from '../lib'

describe('AutoApproveIntegration', () => {
  describe('Base functionality', () => {
    it('should respond with a valid health check', () => {
      const integration = new AutoApproveIntegration()
      const res = integration.HealthCheck()
      expect(res.status.code).toBe(0)
    })

    it('should respond with a valid integration info', () => {
      const integration = new AutoApproveIntegration()
      const res = integration.GetInfo()
      expect(res.name).toBe('indent-auto-approvals')
      expect(res.capabilities).toContain('GetDecision')
    })
  })

  const date = new Date().toISOString()
  const options = {
    name: 'indent-auto-webhook',
  }

  const autoApproveInput = {
    events: [
      {
        event: 'access/request',
        actor: {
          id: 'U0ABCDEFGHIJKLMNOP',
          displayName: 'John Requester',
          kind: 'slack/user',
          email: 'john.requester@example.com',
        },
        meta: {
          labels: {
            'indent.com/time/expires': date,
            'indent.com/workflow/origin/id': 'test-000000000',
            'indent.com/workflow/origin/run/id': 'test-000000000',
          },
        },
        resources: [],
      },
    ],
  }

  describe('GetDecision', () => {
    it('should respond with Approval details', async () => {
      const integration = new AutoApproveIntegration(options)
      const res = await integration.GetDecision(autoApproveInput)

      expect(res).toBeTruthy()
    })
  })
})
