import { addMock } from '@indent/base-integration'
import { JiraProjectRoleIntegration } from '..'

const JIRA_INSTANCE_URL = process.env.JIRA_INSTANCE_URL || ''

describe('JiraProjectRoleIntegration', () => {
  describe('Base functionality', () => {
    it('should respond with a valid health check', () => {
      const integration = new JiraProjectRoleIntegration()
      const res = integration.HealthCheck()
      expect(res.status).toStrictEqual({})
    })

    it('should respond with a valid integration info', () => {
      const integration = new JiraProjectRoleIntegration()
      const res = integration.GetInfo()
      expect(res.name).toBe('indent-jira-project-role-webhook')
    })
  })

  const resourcePair = [
    {
      kind: 'user',
      id: 'u123',
      jiraId: 'j456',
    },
    {
      kind: 'jira.v1.projectrole',
      id: 'project/example/role/role1234',
    },
  ]

  describe('ApplyUpdate', () => {
    beforeEach(() => setupMocks())

    describe('access/grant', () => {
      it('should respond with success (from mock)', () => {
        const integration = new JiraProjectRoleIntegration()
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
        const integration = new JiraProjectRoleIntegration()
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
  const empty200 = {
    config: {},
    headers: {},
    status: 200,
    statusText: '200',
    data: null,
  }

  addMock(
    {
      method: 'post',
      baseURL: `${JIRA_INSTANCE_URL}`,
      url: '/rest/api/3/project/example/role/role1234',
    },
    empty200
  )

  addMock(
    {
      method: 'delete',
      baseURL: `${JIRA_INSTANCE_URL}`,
      url: '/rest/api/3/project/example/role/role1234',
    },
    { config: {}, headers: {}, status: 204, statusText: '204', data: null }
  )

  addMock(
    {
      method: 'post',
      baseURL: `${JIRA_INSTANCE_URL}`,
      url: '/rest/api/3/project/example/role/role5678',
    },
    {
      config: {},
      headers: {},
      status: 404,
      statusText: '404 NOT FOUND',
      data: null,
    }
  )

  addMock(
    {
      method: 'delete',
      baseURL: `${JIRA_INSTANCE_URL}`,
      url: '/rest/api/3/project/example/role/role5678',
    },
    {
      config: {},
      headers: {},
      status: 404,
      statusText: '404 NOT FOUND',
      data: null,
    }
  )
}
