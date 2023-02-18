import { addMock } from '@indent/base-integration'
import {
  TWINGATE_GROUP_TYPE,
  TWINGATE_QUERY_LIST_GROUPS,
  TwingateGroupIntegration,
  kindTwingateGroup,
} from '../src'

const NETWORK = process.env.TWINGATE_NETWORK || ''

describe('TwingateGroupIntegration', () => {
  describe('Base functionality', () => {
    it('should respond with a valid health check', () => {
      const integration = new TwingateGroupIntegration()
      const res = integration.HealthCheck()
      expect(res.status).toStrictEqual({})
    })

    it('should respond with a valid integration info', () => {
      const integration = new TwingateGroupIntegration()
      const res = integration.GetInfo()
      expect(res.name).toBe('indent-integration-twingate')
    })
  })

  const resourcePair = [
    {
      kind: 'user',
      id: 'user1234',
      email: 'user1234@example.com',
    },
    {
      kind: 'twingate.v1.Group',
      id: 'group:example',
      labels: {
        'twingate/network': 'rainbow',
      },
    },
  ]

  describe('PullUpdate', () => {
    beforeEach(() => setupMocks())
    it('should return users and groups', () => {
      const integration = new TwingateGroupIntegration()
      return integration
        .PullUpdate({
          kinds: [kindTwingateGroup],
        })
        .then((res) =>
          expect(res.resources).toMatchObject([
            {
              displayName: 'Testing',
              id: 'R3JvdXA6NTQ4Njk=',
              kind: 'twingate.v1.Group',
              labels: {
                'twingate.v1.Group/is_active': 'true',
                'twingate.v1.Group/type': 'MANUAL',
              },
            },
          ])
        )
    })
  })

  describe.skip('ApplyUpdate', () => {
    beforeEach(() => setupMocks())
    describe('access/grant', () => {
      it('should respond with success (from mock)', () => {
        const integration = new TwingateGroupIntegration()
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
        const integration = new TwingateGroupIntegration()
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
})

function setupMocks() {
  addMock(
    {
      method: 'POST',
      baseURL: `https://${NETWORK}.twingate.com/api/graphql/`,
      data: {
        query: TWINGATE_QUERY_LIST_GROUPS,
        variables: {
          filter: {
            type: {
              in: [TWINGATE_GROUP_TYPE],
            },
          },
        },
      },
    },
    {
      config: {},
      headers: {},
      status: 200,
      statusText: '200',
      data: {
        data: {
          groups: {
            edges: [
              {
                node: {
                  id: 'R3JvdXA6NTQ4Njk=',
                  name: 'Testing',
                  createdAt: '2022-07-06T01:10:56.382376+00:00',
                  updatedAt: '2022-07-06T01:10:56.382393+00:00',
                  isActive: true,
                  type: 'MANUAL',
                },
              },
            ],
            pageInfo: {
              startCursor: 'YXJyYXljb25uZWN0aW9uOjA=',
              hasNextPage: false,
            },
          },
        },
      },
    }
  )
}
