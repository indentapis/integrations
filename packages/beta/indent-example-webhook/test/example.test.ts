import { ExampleIntegration } from '..'

describe('ExampleIntegration', () => {
  describe('Base functionality', () => {
    it('should respond with a valid health check', () => {
      const integration = new ExampleIntegration()
      const res = integration.HealthCheck()

      expect(res.status.code).toBe(0)
    })

    it('should respond with a valid integration info', () => {
      const integration = new ExampleIntegration()
      const res = integration.GetInfo()

      expect(res.name).toBe('indent-example-webhook')
    })
  })

  describe('PullUpdate', () => {
    it('should not match for unrelated kinds', () => {
      const integration = new ExampleIntegration()

      expect(integration.MatchPull({ kinds: ['random-kind'] })).toBeFalsy()
    })

    it('should respond with a list of 10 resources', () => {
      const integration = new ExampleIntegration()

      return integration
        .PullUpdate({ kinds: ['example.v1.group'] })
        .then((res) => expect(res.resources).toHaveLength(1))
    })
  })
})
