// import { addMock } from '@indent/base-integration'
import { GithubIssueIntegration } from '..'

describe('GithubIssueIntegration', () => {
  describe('Base functionality', () => {
    it('should respond with a valid health check', () => {
      const integration = new GithubIssueIntegration()
      const res = integration.HealthCheck()
      expect(res.status.code).toBe(0)
    })

    it('should respond with a valid integration info', () => {
      const integration = new GithubIssueIntegration()
      const res = integration.GetInfo()
      expect(res.name).toBe('indent-github-issue-webhook')
    })
  })
})
