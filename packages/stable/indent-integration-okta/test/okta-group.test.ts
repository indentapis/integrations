import { addMock } from '@indent/base-integration'
import {
  OktaDecisionIntegration,
  OktaGroup,
  OktaGroupIntegration,
} from '../lib'

const OKTA_DOMAIN = process.env.OKTA_DOMAIN || ''

describe('OktaGroupIntegration', () => {
  describe('Base functionality', () => {
    it('should respond with a valid health check', () => {
      const integration = new OktaGroupIntegration()
      const res = integration.HealthCheck()
      expect(res.status).toStrictEqual({ code: 0 })
    })

    it('should respond with a valid integration info', () => {
      const integration = new OktaGroupIntegration()
      const res = integration.GetInfo()
      expect(res.name).toBe('indent-okta-groups-webhook')
    })
  })

  const resourcePair = [
    {
      kind: 'okta.v1.User',
      id: 'u123',
      email: 'test@example.com',
    },
    {
      kind: 'okta.v1.Group',
      id: 'g123',
    },
  ]

  describe('ApplyUpdate', () => {
    beforeEach(() => setupMocks())

    describe('access/grant', () => {
      it('should respond with success (from mock)', () => {
        const integration = new OktaGroupIntegration()
        return integration
          .ApplyUpdate({
            events: [
              {
                event: 'access/grant',
                resources: resourcePair,
              },
            ],
          })
          .then((res) => expect(res.status).toStrictEqual({}))
      })
    })

    describe('access/revoke', () => {
      it('should respond with success (from mock)', () => {
        const integration = new OktaGroupIntegration()
        return integration
          .ApplyUpdate({
            events: [
              {
                event: 'access/revoke',
                resources: resourcePair,
              },
            ],
          })
          .then((res) => expect(res.status).toStrictEqual({}))
      })
    })
  })

  describe('PullUpdate', () => {
    beforeEach(() => setupMocks())

    it('should respond with a list of 1 resources (from mock)', () => {
      const integration = new OktaGroupIntegration()
      return integration.PullUpdate({ kinds: ['okta.v1.Group'] }).then((res) =>
        expect(res.resources).toStrictEqual([
          {
            id: 'okta.example.com/api/v1/groups/0g123',
            kind: 'okta.v1.Group',
            labels: {
              description: '',
              oktaGroupType: 'OKTA_GROUP',
              oktaId: '0g123',
              timestamp: res.resources[0].labels.timestamp,
            },
          },
        ])
      )
    })
  })

  const date = new Date().toISOString()
  const options = {
    name: 'indent-okta-groups-webhook',
    autoApprovedOktaGroups: ['0ohijklmn5678'],
  }

  const autoApproveInput = {
    events: [
      {
        event: 'access/request',
        actor: {
          id: 'U0ABCDEFGHIJKLMNOP',
          displayName: 'Jane Okta',
          kind: 'slack/user',
          email: 'jane.okta@example.com',
          labels: {
            oktaId: 'u123',
          },
        },
        meta: {
          labels: {
            'indent.com/time/expires': date,
            'indent.com/workflow/origin/id': 'test-11111111',
            'indent.com/workflow/origin/run/id': 'test-11111111',
          },
        },
        resources: [],
      },
    ],
  }

  describe('GetDecision', () => {
    beforeEach(() => setupMocks())
    it.skip('should respond with Approval details', async () => {
      const integration = new OktaDecisionIntegration(options)
      const res = await integration.GetDecision(autoApproveInput)

      expect(res).toBeTruthy()
    })

    it('should respond with Denial', async () => {
      const integration = new OktaDecisionIntegration({
        ...options,
        autoDenialExcludeOktaGroups: ['123'],
      })
      const res = await integration.GetDecision(autoApproveInput)

      expect(res.claims[0].event).toEqual('access/deny')
    })

    it('should respond with no claims', async () => {
      const integration = new OktaDecisionIntegration({
        ...options,
        autoDenialExcludeOktaGroups: ['0ohijklmn5678'],
      })
      const res = await integration.GetDecision(autoApproveInput)
      expect(res.claims).toHaveLength(0)
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
      url: '/api/v1/users?search=(profile.email eq "test@example.com")',
      baseURL: `https://${OKTA_DOMAIN}`,
    },
    {
      config: {},
      headers: {},
      status: 200,
      statusText: '200',
      data: [
        {
          id: 'u123',
        },
      ],
    }
  )
  addMock(
    {
      method: 'put',
      url: '/api/v1/groups/g123/users/u123',
      baseURL: `https://${OKTA_DOMAIN}`,
    },
    empty200
  )
  addMock(
    {
      method: 'delete',
      url: '/api/v1/groups/g123/users/u123',
      baseURL: `https://${OKTA_DOMAIN}`,
    },
    empty200
  )
  addMock(
    {
      method: 'get',
      url: '/api/v1/groups',
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
          type: 'OKTA_GROUP',
        },
      ] as OktaGroup[],
    }
  )
  addMock(
    {
      method: 'get',
      url: '/api/v1/users/u123/groups',
      baseURL: `https://${OKTA_DOMAIN}`,
    },
    {
      config: {},
      headers: {},
      status: 200,
      statusText: '200',
      data: [
        {
          id: '0ohijklmn5678',
          profile: {
            name: 'Group Alpha',
            description: 'The first group in the Greek alphabet',
          },
        },
      ],
    }
  )
}
