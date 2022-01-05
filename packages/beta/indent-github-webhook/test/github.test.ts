import { addMock } from '@indent/base-webhook'
import { GithubTeamsIntegration } from '..'

function setupMocks() {
  addMock(
    {
      method: 'get',
      baseURL: 'https://api.github.com/orgs/example',
      url: '/teams',
    },
    {
      status: 200,
      statusText: '200',
      headers: {},
      data: [
        {
          id: 1,
          node_id: 'MDQ6VGVhbTE=',
          url: 'https://api.github.com/teams/1',
          html_url: 'https://github.com/orgs/github/teams/justice-league',
          name: 'Justice League',
          slug: 'justice-league',
          description: 'A great team.',
          privacy: 'closed',
          permission: 'admin',
          members_url: 'https://api.github.com/teams/1/members{/member}',
          repositories_url: 'https://api.github.com/teams/1/repos',
          parent: null,
        },
      ],
      config: {},
    }
  )
}

describe('GithubTeamsIntegration', () => {
  describe('Base functionality', () => {
    it('should respond with a valid health check', () => {
      const integration = new GithubTeamsIntegration()
      const res = integration.HealthCheck()
      expect(res.status.code).toBe(0)
    })

    it('should respond with a valid integration info', () => {
      const integration = new GithubTeamsIntegration()
      const res = integration.GetInfo()
      expect(res.name).toBe('indent-github-teams-webhook')
    })
  })

  describe('PullUpdate', () => {
    beforeEach(() => setupMocks())

    // it('should not match for unrelated kinds', () => {
    //   const integration = new GithubTeamsIntegration()
    //   expect(integration.MatchPull({ kinds: ['random-kind'] })).toBeFalsy()
    // })

    it('should respond with a list of 1 resources (from mock)', () => {
      const integration = new GithubTeamsIntegration()
      return integration
        .PullUpdate({ kinds: ['github.v1.Team'] })
        .then((res) => expect(res.resources).toHaveLength(1))
    })
  })
})
