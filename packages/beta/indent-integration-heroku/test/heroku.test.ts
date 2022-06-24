import { addMock } from '@indent/base-integration'
import { HerokuTeamsIntegration } from '..'

describe('HerokuTeamsIntegration', () => {
  describe('Base functionality', () => {
    it('should respond with a valid health check', () => {
      const integration = new HerokuTeamsIntegration()
      const res = integration.HealthCheck()
      expect(res.status.code).toBe(0)
    })

    it('should respond with a valid integration info', () => {
      const integration = new HerokuTeamsIntegration()
      const res = integration.GetInfo()
      expect(res.name).toBe('indent-integration-heroku')
    })
  })

  describe('PullUpdate', () => {
    beforeEach(() => setupMocks())

    // it('should not match for unrelated kinds', () => {
    //   const integration = new HerokuTeamsIntegration()
    //   expect(integration.MatchPull({ kinds: ['random-kind'] })).toBeFalsy()
    // })

    it('should respond with a list of 1 resources (from mock)', () => {
      const integration = new HerokuTeamsIntegration()
      return integration
        .PullUpdate({ kinds: ['heroku.v1.Team'] })
        .then((res) => expect(res.resources).toHaveLength(1))
    })
  })

  const resourcePair = [
    {
      kind: 'user',
      id: 'u123',
      email: 'someone@example.org',
    },
    {
      kind: 'heroku.v1.Team',
      id: '01234567-89ab-cdef-0123-456789abcdef',
      labels: {
        'heroku/id': '01234567-89ab-cdef-0123-456789abcdef',
      },
    },
  ]

  describe('ApplyUpdate', () => {
    beforeEach(() => setupMocks())

    describe('access/grant', () => {
      it('should respond with success (from mock)', () => {
        const integration = new HerokuTeamsIntegration()
        return integration
          .ApplyUpdate({
            events: [{ event: 'access/grant', resources: resourcePair }],
          })
          .then((res) => expect(res.status).toEqual({}))
      })
    })

    describe('access/revoke', () => {
      it('should respond with success code when user is removed from a team (from mock)', () => {
        const integration = new HerokuTeamsIntegration()
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
      method: 'GET',
      baseURL: 'https://api.heroku.com',
      url: '/teams',
    },
    {
      status: 200,
      statusText: '200',
      headers: {
        'Content-Type': 'application/vnd.heroku+json; version=3',
      },
      data: [
        {
          id: '01234567-89ab-cdef-0123-456789abcdef',
          created_at: '2012-01-01T12:00:00Z',
          credit_card_collections: true,
          default: true,
          enterprise_account: {
            id: '01234567-89ab-cdef-0123-456789abcdef',
            name: 'example',
          },
          identity_provider: {
            id: '01234567-89ab-cdef-0123-456789abcdef',
            name: 'acme-sso',
            owner: {
              id: '01234567-89ab-cdef-0123-456789abcdef',
              name: 'acme',
              type: 'team',
            },
          },
          membership_limit: 25,
          name: 'example',
          provisioned_licenses: true,
          role: 'admin',
          type: 'team',
          updated_at: '2012-01-01T12:00:00Z',
        },
      ],
      config: {},
    }
  )
  addMock(
    {
      method: 'PUT',
      baseURL: 'https://api.heroku.com',
      url: '/teams/01234567-89ab-cdef-0123-456789abcdef/members',
    },
    {
      status: 201,
      statusText: '201',
      headers: {
        'Content-Type': 'application/vnd.heroku+json; version=3',
      },
      data: {
        created_at: '2012-01-01T12:00:00Z',
        email: 'someone@example.org',
        federated: false,
        id: '01234567-89ab-cdef-0123-456789abcdef',
        identity_provider: {
          id: '01234567-89ab-cdef-0123-456789abcdef',
          name: 'acme',
          redacted: false,
          owner: {
            id: '01234567-89ab-cdef-0123-456789abcdef',
            name: 'acme',
            type: 'team',
          },
        },
        role: 'admin',
        two_factor_authentication: true,
        updated_at: '2012-01-01T12:00:00Z',
        user: {
          email: 'username@example.com',
          id: '01234567-89ab-cdef-0123-456789abcdef',
          name: 'Tina Edmonds',
        },
      },
      config: {},
    }
  )

  addMock(
    {
      method: 'DELETE',
      baseURL: 'https://api.heroku.com',
      url: '/teams/01234567-89ab-cdef-0123-456789abcdef/members/01234567-89ab-cdef-0123-456789abcdef',
    },
    {
      status: 200,
      statusText: '200',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/vnd.heroku+json; version=3',
      },
      data: {
        created_at: '2012-01-01T12:00:00Z',
        email: 'someone@example.org',
        federated: false,
        id: '01234567-89ab-cdef-0123-456789abcdef',
        identity_provider: {
          id: '01234567-89ab-cdef-0123-456789abcdef',
          name: 'acme',
          redacted: false,
          owner: {
            id: '01234567-89ab-cdef-0123-456789abcdef',
            name: 'acme',
            type: 'team',
          },
        },
        role: 'admin',
        two_factor_authentication: true,
        updated_at: '2012-01-01T12:00:00Z',
        user: {
          email: 'username@example.com',
          id: '01234567-89ab-cdef-0123-456789abcdef',
          name: 'Tina Edmonds',
        },
      },
      config: {},
    }
  )
}
addMock(
  {
    method: 'GET',
    baseURL: 'https://api.heroku.com',
    url: '/teams',
  },
  {
    status: 200,
    statusText: '200',
    headers: {
      'Content-Type': 'application/vnd.heroku+json; version=3',
    },
    data: [
      {
        id: '01234567-89ab-cdef-0123-456789abcdef',
        created_at: '2012-01-01T12:00:00Z',
        credit_card_collections: true,
        default: true,
        enterprise_account: {
          id: '01234567-89ab-cdef-0123-456789abcdef',
          name: 'example',
        },
        identity_provider: {
          id: '01234567-89ab-cdef-0123-456789abcdef',
          name: 'acme-sso',
          owner: {
            id: '01234567-89ab-cdef-0123-456789abcdef',
            name: 'acme',
            type: 'team',
          },
        },
        membership_limit: 25,
        name: 'example',
        provisioned_licenses: true,
        role: 'admin',
        type: 'team',
        updated_at: '2012-01-01T12:00:00Z',
      },
    ],
    config: {},
  }
)
addMock(
  {
    method: 'PUT',
    baseURL: 'https://api.heroku.com',
    url: '/teams/01234567-89ab-cdef-0123-456789abcdef/members',
  },
  {
    status: 201,
    statusText: '201',
    headers: {
      'Content-Type': 'application/vnd.heroku+json; version=3',
    },
    data: {
      created_at: '2012-01-01T12:00:00Z',
      email: 'someone@example.org',
      federated: false,
      id: '01234567-89ab-cdef-0123-456789abcdef',
      identity_provider: {
        id: '01234567-89ab-cdef-0123-456789abcdef',
        name: 'acme',
        redacted: false,
        owner: {
          id: '01234567-89ab-cdef-0123-456789abcdef',
          name: 'acme',
          type: 'team',
        },
      },
      role: 'admin',
      two_factor_authentication: true,
      updated_at: '2012-01-01T12:00:00Z',
      user: {
        email: 'username@example.com',
        id: '01234567-89ab-cdef-0123-456789abcdef',
        name: 'Tina Edmonds',
      },
    },
    config: {},
  }
)

addMock(
  {
    method: 'DELETE',
    baseURL: 'https://api.heroku.com',
    url: '/teams/01234567-89ab-cdef-0123-456789abcdef/members/someone@example.org',
  },
  {
    status: 200,
    statusText: '200',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/vnd.heroku+json; version=3',
    },
    data: {
      created_at: '2012-01-01T12:00:00Z',
      email: 'someone@example.org',
      federated: false,
      id: '01234567-89ab-cdef-0123-456789abcdef',
      identity_provider: {
        id: '01234567-89ab-cdef-0123-456789abcdef',
        name: 'acme',
        redacted: false,
        owner: {
          id: '01234567-89ab-cdef-0123-456789abcdef',
          name: 'acme',
          type: 'team',
        },
      },
      role: 'admin',
      two_factor_authentication: true,
      updated_at: '2012-01-01T12:00:00Z',
      user: {
        email: 'username@example.com',
        id: '01234567-89ab-cdef-0123-456789abcdef',
        name: 'Tina Edmonds',
      },
    },
    config: {},
  }
)
