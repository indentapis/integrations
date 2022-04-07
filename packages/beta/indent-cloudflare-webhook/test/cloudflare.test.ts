import { addMock } from '@indent/base-webhook'
import { CloudflareIntegration } from '..'

const CLOUDFLARE_ACCOUNT = process.env.CLOUDFLARE_ACCOUNT || ''

describe('CloudflareIntegration', () => {
  describe('Base functionality', () => {
    it('should respond with a valid health check', () => {
      const integration = new CloudflareIntegration()
      const res = integration.HealthCheck()
      expect(res.status.code).toBe(0)
    })

    it('should respond with a valid integration info', () => {
      const integration = new CloudflareIntegration()
      const res = integration.GetInfo()
      expect(res.name).toBe('indent-cloudflare-webhook')
    })
  })

  describe('PullUpdate', () => {
    beforeEach(() => setupMocks())

    it('should respond with a list of 1 resources (from mock)', () => {
      const integration = new CloudflareIntegration()
      return integration
        .PullUpdate({ kinds: ['cloudflare.v1.AccountRole'] })
        .then((res) => expect(res.resources).toHaveLength(1))
    })
  })

  const resourcePair = [
    {
      kind: 'user',
      id: 'u123',
      email: 'user@example.com',
    },
    {
      kind: 'cloudflare.v1.AccountRole',
      id: `api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT}/roles/3536bcfad5faccb999b47003c79917fb`,
      labels: {
        'cloudflare/id': '3536bcfad5faccb999b47003c79917fb',
        'cloudflare/role':
          '{"id":"3536bcfad5faccb999b47003c79917fb","name":"Account Administrator","description":"Administrative access to the entire Account","permissions":{"analytics":{"read":true,"write":true},"billing":{"read":true,"write":true},"cache_purge":{"read":true,"write":true},"dns":{"read":true,"write":true},"dns_records":{"read":true,"write":true},"lb":{"read":true,"write":true},"logs":{"read":true,"write":true},"organization":{"read":true,"write":true},"ssl":{"read":true,"write":true},"waf":{"read":true,"write":true},"zones":{"read":true,"write":true},"zone_settings":{"read":true,"write":true}}}',
      },
    },
  ]

  describe('ApplyUpdate', () => {
    beforeEach(() => setupMocks())

    describe('access/grant', () => {
      it('should respond with success (from mock)', () => {
        const integration = new CloudflareIntegration()
        return integration
          .ApplyUpdate({
            events: [{ event: 'access/grant', resources: resourcePair }],
          })
          .then((res) =>
            expect(res.status).toStrictEqual({
              code: 0,
            })
          )
      })
    })

    describe('access/revoke', () => {
      it('should respond with success code when user is removed from a team (from mock)', () => {
        const integration = new CloudflareIntegration()
        return integration
          .ApplyUpdate({
            events: [{ event: 'access/revoke', resources: resourcePair }],
          })
          .then((res) =>
            expect(res.status).toStrictEqual({
              code: 0,
            })
          )
      })
    })
  })
})

function setupMocks() {
    addMock(
      {
        method: 'GET',
        baseURL: 'https://api.cloudflare.com',
        url: `/client/v4/accounts/${CLOUDFLARE_ACCOUNT}/roles`,
      },
      {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          success: true,
          errors: [],
          messages: [],
          result: [
            {
              id: '3536bcfad5faccb999b47003c79917fb',
              name: 'Account Administrator',
              description: 'Administrative access to the entire Account',
              permissions: {
                analytics: {
                  read: true,
                  write: true,
                },
                billing: {
                  read: true,
                  write: true,
                },
                cache_purge: {
                  read: true,
                  write: true,
                },
                dns: {
                  read: true,
                  write: true,
                },
                dns_records: {
                  read: true,
                  write: true,
                },
                lb: {
                  read: true,
                  write: true,
                },
                logs: {
                  read: true,
                  write: true,
                },
                organization: {
                  read: true,
                  write: true,
                },
                ssl: {
                  read: true,
                  write: true,
                },
                waf: {
                  read: true,
                  write: true,
                },
                zones: {
                  read: true,
                  write: true,
                },
                zone_settings: {
                  read: true,
                  write: true,
                },
              },
            },
          ],
        },
        config: {},
      }
    )
  addMock(
    {
      method: 'GET',
      baseURL: 'https://api.cloudflare.com',
      url: `/client/v4/accounts/${CLOUDFLARE_ACCOUNT}/members?per_page=50`,
    },
    {
      status: 200,
      statusText: '200',
      headers: {},
      data: {
        success: true,
        errors: [],
        messages: [],
        result: [
          {
            id: '4536bcfad5faccb111b47003c79917fa',
            code: '05dd05cce12bbed97c0d87cd78e89bc2fd41a6cee72f27f6fc84af2e45c0fac0',
            user: {
              id: '7c5dae5552338874e5053f2534d2767a',
              first_name: 'John',
              last_name: 'Appleseed',
              email: 'user@example.com',
              two_factor_authentication_enabled: false,
            },
            status: 'accepted',
            roles: [
              {
                id: '3536bcfad5faccb999b47003c79917fb',
                name: 'Account Administrator',
                description: 'Administrative access to the entire Account',
                permissions: {
                  analytics: {
                    read: true,
                    write: true,
                  },
                  billing: {
                    read: true,
                    write: true,
                  },
                  cache_purge: {
                    read: true,
                    write: true,
                  },
                  dns: {
                    read: true,
                    write: true,
                  },
                  dns_records: {
                    read: true,
                    write: true,
                  },
                  lb: {
                    read: true,
                    write: true,
                  },
                  logs: {
                    read: true,
                    write: true,
                  },
                  organization: {
                    read: true,
                    write: true,
                  },
                  ssl: {
                    read: true,
                    write: true,
                  },
                  waf: {
                    read: true,
                    write: true,
                  },
                  zones: {
                    read: true,
                    write: true,
                  },
                  zone_settings: {
                    read: true,
                    write: true,
                  },
                },
              },
            ],
          },
          {
            id: '4536bcfad5faccb111b47003c79917fb',
            code: '05dd05cce12bbed97c0d87cd78e89bc2fd41a6cee72f27f6fc84af2e45c0fac1',
            user: {
              id: '7c5dae5552338874e5053f2534d2767b',
              first_name: 'Jane',
              last_name: 'Appleseed',
              email: 'user2@example.com',
              two_factor_authentication_enabled: false,
            },
            status: 'accepted',
            roles: [
              {
                id: '3536bcfad5faccb999b47003c79917fb',
                name: 'Account Administrator',
                description: 'Administrative access to the entire Account',
                permissions: {
                  analytics: {
                    read: true,
                    write: true,
                  },
                  billing: {
                    read: true,
                    write: true,
                  },
                  cache_purge: {
                    read: true,
                    write: true,
                  },
                  dns: {
                    read: true,
                    write: true,
                  },
                  dns_records: {
                    read: true,
                    write: true,
                  },
                  lb: {
                    read: true,
                    write: true,
                  },
                  logs: {
                    read: true,
                    write: true,
                  },
                  organization: {
                    read: true,
                    write: true,
                  },
                  ssl: {
                    read: true,
                    write: true,
                  },
                  waf: {
                    read: true,
                    write: true,
                  },
                  zones: {
                    read: true,
                    write: true,
                  },
                  zone_settings: {
                    read: true,
                    write: true,
                  },
                },
              },
            ],
          },
        ],
      },
      config: {},
    }
  )
  addMock(
    {
      method: 'DELETE',
      baseURL: 'https://api.cloudflare.com',
      url: `/client/v4/accounts/${CLOUDFLARE_ACCOUNT}/members/4536bcfad5faccb111b47003c79917fa`,
    },
    {
      status: 204,
      statusText: 'OK',
      headers: {},
      data: {
        success: true,
        errors: [],
        messages: [],
        result: {
          id: '9a7806061c88ada191ed06f989cc3dac',
        },
      },
      config: {},
    }
  )
  addMock(
    {
      method: 'PUT',
      baseURL: 'https://api.cloudflare.com',
      url: `/client/v4/accounts/${CLOUDFLARE_ACCOUNT}/members/4536bcfad5faccb111b47003c79917fa`,
    },
    {
      status: 201,
      statusText: 'OK',
      headers: {},
      data: {
        success: true,
        errors: [],
        messages: [],
        result: {
          id: '4536bcfad5faccb111b47003c79917fa',
          code: '05dd05cce12bbed97c0d87cd78e89bc2fd41a6cee72f27f6fc84af2e45c0fac0',
          user: {
            id: '7c5dae5552338874e5053f2534d2767a',
            first_name: 'John',
            last_name: 'Appleseed',
            email: 'user@example.com',
            two_factor_authentication_enabled: false,
          },
          status: 'accepted',
          roles: [
            {
              id: '3536bcfad5faccb999b47003c79917fb',
              name: 'Account Administrator',
              description: 'Administrative access to the entire Account',
              permissions: {
                analytics: {
                  read: true,
                  write: true,
                },
                billing: {
                  read: true,
                  write: true,
                },
                cache_purge: {
                  read: true,
                  write: true,
                },
                dns: {
                  read: true,
                  write: true,
                },
                dns_records: {
                  read: true,
                  write: true,
                },
                lb: {
                  read: true,
                  write: true,
                },
                logs: {
                  read: true,
                  write: true,
                },
                organization: {
                  read: true,
                  write: true,
                },
                ssl: {
                  read: true,
                  write: true,
                },
                waf: {
                  read: true,
                  write: true,
                },
                zones: {
                  read: true,
                  write: true,
                },
                zone_settings: {
                  read: true,
                  write: true,
                },
              },
            },
          ],
        },
      },
      config: {},
    }
  )
}
