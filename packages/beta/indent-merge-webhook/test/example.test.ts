import { MergeIntegration } from '..'

describe('ExampleIntegration', () => {
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

  // describe('PullUpdate', () => {
  //   it('should not match for unrelated kinds', () => {
  //     const integration = new MergeIntegration()
  //     expect(integration.MatchPull({ kinds: ['random-kind'] })).toBeFalsy()
  //   })
  //   it('should respond with a list of 10 resources', () => {
  //     const integration = new MergeIntegration()
  //     return integration
  //       .PullUpdate({ kinds: ['example.v1.group'] })
  //       .then((res) => expect(res.resources).toHaveLength(1))
  //   })
  // })
})
