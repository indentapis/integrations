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
      kind: 'user',
      id: 'u123',
    },
    {
      kind: 'group',
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
            oktaId: '0oabcdefg1234',
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
    it('should respond with Approval details', async () => {
      const integration = new OktaDecisionIntegration(options)
      const res = await integration.GetDecision(autoApproveInput)

      expect(res).toBeTruthy()
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
      url: '/api/v1/users/0oabcdefg1234/groups',
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
