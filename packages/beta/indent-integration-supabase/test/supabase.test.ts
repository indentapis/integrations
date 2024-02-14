import { StatusCode, addMock } from '@indent/base-integration'
import { SupabaseIntegration } from '..'

const SUPABASE_ORG_ID = process.env.SUPABASE_ORG_ID || ''

describe('SupabaseIntegration', () => {
  describe('Base functionality', () => {
    it('should respond with a valid health check', () => {
      const integration = new SupabaseIntegration()
      const res = integration.HealthCheck()
      expect(res.status.code).toBe(0)
    })

    it('should respond with a valid integration info', () => {
      const integration = new SupabaseIntegration()
      const res = integration.GetInfo()
      expect(res.name).toBe('indent-supabase-webhook')
    })
  })

  describe('PullUpdate', () => {
    beforeEach(() => setupMocks())

    it('should respond with a list of roles (from mock)', async () => {
      const integration = new SupabaseIntegration()
      const res = await integration.PullUpdate({ kinds: ['supabase.v1.Role'] })
      expect(res.resources.length).toBeGreaterThan(0)
      expect(res.resources[0].kind).toBe('supabase.v1.Role')
    })
  })

  const resourcePair = [
    {
      kind: 'user',
      id: 'u123',
      email: 'user@example.com',
    },
    {
      kind: 'supabase.v1.Role',
      id: `${SUPABASE_ORG_ID}-3729916`,
      displayName: 'Administrator',
      labels: {
        role_id: '3729916',
      },
    },
  ]

  describe('ApplyUpdate', () => {
    beforeEach(() => setupMocks())

    describe('access/grant', () => {
      it('should respond with success (from mock)', async () => {
        const integration = new SupabaseIntegration()
        const res = await integration.ApplyUpdate({
          events: [{ event: 'access/grant', resources: resourcePair }],
        })
        expect(res.status.code).toEqual(StatusCode.OK)
      })
    })

    describe('access/revoke', () => {
      it('should respond with success (from mock)', async () => {
        const integration = new SupabaseIntegration()
        const res = await integration.ApplyUpdate({
          events: [{ event: 'access/revoke', resources: resourcePair }],
        })
        expect(res.status.message).toBeUndefined()
        expect(res.status.code).toEqual(StatusCode.OK)
      })
    })
  })
})

function setupMocks() {
  addMock(
    {
      method: 'GET',
      baseURL: 'https://api.supabase.io',
      url: `/v0/organizations/${SUPABASE_ORG_ID}/roles`,
    },
    {
      status: 200,
      data: [
        {
          id: 3729916,
          name: 'Administrator',
          description: null,
        },
        {
          id: 3729918,
          name: 'Developer',
          description: null,
        },
        {
          id: 3729920,
          name: 'Owner',
          description: null,
        },
      ],
      statusText: '',
      headers: undefined,
      config: undefined,
    }
  )

  addMock(
    {
      method: 'GET',
      baseURL: 'https://api.supabase.io',
      url: `/v0/organizations/${SUPABASE_ORG_ID}/members`,
    },
    {
      status: 200,
      data: [
        {
          gotrue_id: 'f650384e-0d8d-440c-91d6-a428cf6094c9',
          primary_email: 'admin@example.com',
          role_ids: [3729920],
          username: 'user',
          mfa_enabled: false,
        },
      ],
      statusText: '',
      headers: undefined,
      config: undefined,
    }
  )

  addMock(
    {
      method: 'POST',
      baseURL: 'https://api.supabase.io',
      url: `/v0/organizations/${SUPABASE_ORG_ID}/members/invite`,
      data: {
        invited_email: 'user@example.com',
        role_id: 3729916,
      },
    },
    {
      status: 200,
      data: {
        invited_email: 'user@example.com',
        role_id: 3729916,
      },
      statusText: '',
      headers: undefined,
      config: undefined,
    }
  )

  addMock(
    {
      method: 'DELETE',
      baseURL: 'https://api.supabase.io',
      url: `/v0/organizations/${SUPABASE_ORG_ID}/members/invite?invited_id=f650384e-0d8d-440c-91d6-a428cf6094c9`,
    },
    {
      status: 200,
      data: undefined,
      statusText: '',
      headers: undefined,
      config: undefined,
    }
  )
}
