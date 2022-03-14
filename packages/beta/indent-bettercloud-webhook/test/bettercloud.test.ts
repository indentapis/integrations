import { addMock } from '@indent/base-webhook'
import {
  BettercloudActionIntegration,
  BettercloudWorkflowIntegration,
} from '..'

describe('BettercloudActionIntegration', () => {
  describe('Base functionality', () => {
    it('should respond with a valid health check', () => {
      const integration = new BettercloudActionIntegration()
      const res = integration.HealthCheck()
      expect(res.status.code).toBe(0)
    })

    it('should respond with a valid integration info', () => {
      const integration = new BettercloudActionIntegration()
      const res = integration.GetInfo()
      expect(res.name).toBe('indent-bettercloud-action-webhook')
    })
  })

  describe('PullUpdate', () => {
    beforeEach(() => setupMockActions())

    // it('should not match for unrelated kinds', () => {
    //   const integration = new BettercloudActionIntegration()
    //   expect(integration.MatchPull({ kinds: ['random-kind'] })).toBeFalsy()
    // })

    it('should respond with a list of resources (from mock)', () => {
      const integration = new BettercloudActionIntegration()
      return integration
        .PullUpdate({ kinds: ['bettercloud.v1.Action'] })
        .then((res) => expect(res.resources).toHaveLength(10))
    })
  })

  const actionId = '04d17606-6601-11e5-9d70-feff819cdc9f'
  const resourcePair = [
    {
      kind: 'user',
      id: 'u123',
      labels: {
        'slack/id': 'U012345678',
      },
    },
    {
      kind: 'bettercloud.v1.Action',
      id: actionId,
      labels: {
        'bettercloud/id': actionId,
        grantActionId: actionId,
        revokeActionId: actionId,
      },
    },
  ]

  describe('ApplyUpdate', () => {
    beforeEach(() => setupMockActions())

    describe('access/grant', () => {
      it('should respond with success (from mock)', () => {
        const integration = new BettercloudActionIntegration()
        return integration
          .ApplyUpdate({
            events: [{ event: 'access/grant', resources: resourcePair }],
          })
          .then((res) => expect(res.status).toEqual({}))
      })
    })

    describe('access/revoke', () => {
      it('should respond with success code when an action is executed (from mock)', () => {
        const integration = new BettercloudActionIntegration()
        return integration
          .ApplyUpdate({
            events: [{ event: 'access/revoke', resources: resourcePair }],
          })
          .then((res) => expect(res.status).toEqual({}))
      })
    })
  })
})

describe('BettercloudWorkflowIntegration', () => {
  describe('Base functionality', () => {
    it('should respond with a valid health check', () => {
      const integration = new BettercloudWorkflowIntegration()
      const res = integration.HealthCheck()
      expect(res.status.code).toBe(0)
    })

    it('should respond with a valid integration info', () => {
      const integration = new BettercloudWorkflowIntegration()
      const res = integration.GetInfo()
      expect(res.name).toBe('indent-bettercloud-workflow-webhook')
    })
  })

  describe('PullUpdate', () => {
    beforeEach(() => setupMockWorkflows())

    // it('should not match for unrelated kinds', () => {
    //   const integration = new BettercloudActionIntegration()
    //   expect(integration.MatchPull({ kinds: ['random-kind'] })).toBeFalsy()
    // })

    it('should respond with a list of resources (from mock)', () => {
      const integration = new BettercloudWorkflowIntegration()
      return integration
        .PullUpdate({ kinds: ['bettercloud.v1.Workflow'] })
        .then((res) => expect(res.resources).toHaveLength(6))
    })
  })

  const workflowId = '015b1c0a-50b7-4ea6-96ca-04baf65f12e6'
  const resourcePair = [
    {
      kind: 'user',
      id: 'u123',
      labels: {
        'slack/id': 'U012345678',
      },
    },
    {
      kind: 'bettercloud.v1.Workflow',
      id: workflowId,
      labels: {
        'bettercloud/id': workflowId,
        grantWorkflowId: workflowId,
        revokeWorkflowId: workflowId,
      },
    },
  ]

  describe('ApplyUpdate', () => {
    beforeEach(() => setupMockWorkflows())

    describe('access/grant', () => {
      it('should respond with success (from mock)', () => {
        const integration = new BettercloudWorkflowIntegration()
        return integration
          .ApplyUpdate({
            events: [{ event: 'access/grant', resources: resourcePair }],
          })
          .then((res) => expect(res.status).toEqual({}))
      })
    })

    describe('access/revoke', () => {
      it('should respond with success code when a workflow is executed (from mock)', () => {
        const integration = new BettercloudWorkflowIntegration()
        return integration
          .ApplyUpdate({
            events: [{ event: 'access/revoke', resources: resourcePair }],
          })
          .then((res) => expect(res.status).toEqual({}))
      })
    })
  })
})

function setupMockWorkflows() {
  addMock(
    {
      method: 'get',
      baseURL: 'https://api.bettercloud.com',
      url: '/v1/workflows',
    },
    {
      status: 200,
      statusText: '200',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      data: {
        content: [
          {
            workflowId: '09c65d3d-ff3a-4059-b9a7-dbc21c66a571',
            name: 'Alert Remediation | Finance File Public Link',
          },
          {
            workflowId: '33910963-4ed2-4125-93ab-501ae7d16c87',
            name: 'Offboarding | G Suite Only',
          },
          {
            workflowId: '0115ca0b-5999-4fa9-aad0-0913b7553dde',
            name: 'Offboarding | Okta',
          },
          {
            workflowId: '015b1c0a-50b7-4ea6-96ca-04baf65f12e6',
            name: 'Onboarding | G Suite Only',
          },
          {
            workflowId: 'f633fee1-203c-42da-b3ee-261e5d7d3a49',
            name: 'Onboarding | Multi-Saas w/ API',
          },
          {
            workflowId: '41d97d49-8da4-47eb-b40c-668b7d4b5bf8',
            name: 'Platform API | Splunk Log Capture Workflow',
          },
        ],
        number: 0,
        size: 6,
        totalElements: 6,
        last: true,
        totalPages: 1,
        first: true,
        numberOfElements: 6,
      },
      config: {},
    }
  )
  addMock(
    {
      method: 'post',
      baseURL: 'https://api.bettercloud.com',
      url: '/v1/workflows/015b1c0a-50b7-4ea6-96ca-04baf65f12e6/execute',
    },
    {
      status: 200,
      statusText: '200',
      headers: {},
      data: {},
      config: {},
    }
  )
}

function setupMockActions() {
  addMock(
    {
      method: 'get',
      baseURL: 'https://api.bettercloud.com',
      url: '/v1/actions',
    },
    {
      status: 200,
      statusText: '200',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      data: {
        content: [
          {
            id: 'aaa7d21e-02eb-4bb4-89dd-f855078bd99e',
            name: "Set User's Manager",
            description: "This action sets a user's manager in Salesforce.",
            parameters: [
              {
                id: '87fba1fa-226a-4f51-b82b-ab08216b1d01',
                required: true,
                name: 'userId',
                type: 'ID',
              },
              {
                id: '908060ce-e3c7-4308-a059-8da6cde39fa1',
                required: true,
                name: 'managerId',
                type: 'ID',
              },
              {
                id: 'a2756e1d-c5cc-4a0e-97b2-85ba127e0a52',
                required: false,
                name: 'externalId',
                type: 'STRING',
              },
              {
                id: 'b6bea60c-8dc9-4bd9-a950-d5f8aa2c6a60',
                required: true,
                name: 'connectorId',
                type: 'STRING',
              },
            ],
          },
          {
            id: 'd5dc3869-c740-48d6-b6b2-05133cd78457',
            name: 'No Op',
            description: 'This is a no operation action.',
            parameters: [
              {
                id: 'd5dc3869-c740-48d6-b6b2-aaaaaaaaaaaa',
                required: false,
                name: 'success',
                type: 'BOOLEAN',
              },
              {
                id: 'd5dc3869-c740-48d6-b6b2-dddddddddddd',
                required: false,
                name: 'retryCount',
                type: 'INTEGER',
              },
              {
                id: 'd5dc3869-c740-48d6-b6b2-eeeeeeeeeeee',
                required: false,
                name: 'sleep',
                type: 'INTEGER',
              },
              {
                id: 'b6bea60c-8dc9-4bd9-a950-d5f8aa2c6a60',
                required: true,
                name: 'connectorId',
                type: 'STRING',
              },
            ],
          },
          {
            id: '66003d08-bb51-4cc7-83bf-cd0b30973197',
            name: "Edit User's Profile",
            description: "This action edits a user's profile in Salesforce",
            parameters: [
              {
                id: 'a08a4c58-3f7e-4c0f-a8f3-a844c48cf63b',
                required: true,
                name: 'userId',
                type: 'ID',
              },
              {
                id: '68e4914e-d68e-4a55-b97e-7e182adc6015',
                required: true,
                name: 'profileId',
                type: 'ID',
              },
              {
                id: 'b6bea60c-8dc9-4bd9-a950-d5f8aa2c6a60',
                required: true,
                name: 'connectorId',
                type: 'STRING',
              },
            ],
          },
          {
            id: 'b42eeca1-200b-4692-adad-73ccac613713',
            name: 'Remove Mobile Device',
            description:
              "This action removes a user's device from Mobile Device Management in the Google Admin Console.",
            parameters: [
              {
                id: '8c11ee04-2da6-419b-b99e-2eff2a20933d',
                required: true,
                name: 'userId',
                type: 'ID',
              },
              {
                id: 'b6bea60c-8dc9-4bd9-a950-d5f8aa2c6a60',
                required: true,
                name: 'connectorId',
                type: 'STRING',
              },
            ],
          },
          {
            id: '0b57807a-5801-434a-bc92-aca1acafdad6',
            name: 'Clear User Sessions',
            description: "This action clears a user's sessions in Okta.",
            parameters: [
              {
                id: '9a9a8920-a799-4996-80a1-fc7f5bca3d52',
                required: true,
                name: 'userId',
                type: 'ID',
              },
              {
                id: 'b6bea60c-8dc9-4bd9-a950-d5f8aa2c6a60',
                required: true,
                name: 'connectorId',
                type: 'STRING',
              },
            ],
          },
          {
            id: '4f6971c5-1813-4e7d-ba16-5ced9f9a156e',
            name: 'Suspend User',
            description: 'This actions suspends a user account in Okta.',
            parameters: [
              {
                id: 'e302e35c-f6ec-433f-984a-db350da7fa20',
                required: true,
                name: 'userId',
                type: 'ID',
              },
              {
                id: 'b6bea60c-8dc9-4bd9-a950-d5f8aa2c6a60',
                required: true,
                name: 'connectorId',
                type: 'STRING',
              },
            ],
          },
          {
            id: '6760bc8f-32a1-4481-a7b1-f9a97ca33670',
            name: 'Set File Collaborator Permissions',
            description:
              "This action sets the permissions for a file's collaborators in Google Drive.",
            parameters: [
              {
                id: '23f3c45c-0eae-4557-9bb3-358fe5033939',
                required: true,
                name: 'userId',
                type: 'ID',
              },
              {
                id: '215e250b-4831-488b-934d-388cd0179018',
                required: true,
                name: 'fileId',
                type: 'ID',
              },
              {
                id: 'a0f8221f-1059-46a9-9787-e09512b8ea1a',
                required: true,
                name: 'role',
                type: 'STRING',
              },
              {
                id: 'b6bea60c-8dc9-4bd9-a950-d5f8aa2c6a60',
                required: true,
                name: 'connectorId',
                type: 'STRING',
              },
            ],
          },
          {
            id: '76b9943e-8266-46c3-9b6f-a87efd4d6557',
            parameters: [
              {
                id: '099c595a-d276-416a-8a42-48d69dbdd844',
                required: false,
                name: 'externalId',
                type: 'STRING',
              },
              {
                id: 'e6f1facc-346b-479e-bd00-ecf094bb73de',
                required: true,
                name: 'userId',
                type: 'ID',
              },
              {
                id: 'c0dfdb94-e3c4-4b83-9740-5d58499688be',
                required: false,
                name: 'returnIM',
                type: 'BOOLEAN',
              },
              {
                id: 'b6bea60c-8dc9-4bd9-a950-d5f8aa2c6a60',
                required: true,
                name: 'connectorId',
                type: 'STRING',
              },
            ],
          },
          {
            id: '081a7b46-5586-4426-9111-613950accfc7',
            name: 'Wipe Mobile Device',
            description:
              'This action allows you to perform an account wipe or mobile wipe of a user\'s device. For more information about using this feature and the prerequisites for it to work correctly, please see this <a href="https://support.google.com/a/answer/173390" target="_blank">Google Help article</a>.',
            parameters: [
              {
                id: '2bdd3c13-b4ee-458c-b3c0-c82be9aba33d',
                required: true,
                name: 'action',
                type: 'STRING',
              },
              {
                id: '7e0a6b67-605e-407a-8d53-f7a88e43895d',
                required: true,
                name: 'userId',
                type: 'ID',
              },
              {
                id: 'b6bea60c-8dc9-4bd9-a950-d5f8aa2c6a60',
                required: true,
                name: 'connectorId',
                type: 'STRING',
              },
            ],
          },
          {
            id: '3399ec69-7d59-4637-815f-46cfbf5ace52',
            name: "Edit User's Phone Number",
            description:
              "This action edits a user's work or home phone number in Google. If 'Replace existing phone number' is selected, then all phone numbers of the selected type (work or home) will be overwritten.",
            parameters: [
              {
                id: 'f8b9996a-3bc7-42fe-82d6-8c8387edac7a',
                required: true,
                name: 'userId',
                type: 'ID',
              },
              {
                id: '162964c5-b46e-47ff-a2c5-91005f4b7d15',
                required: false,
                name: 'userPhoneNumber.value',
                type: 'STRING',
              },
              {
                id: 'cf242b5d-f74d-4e12-8d62-dae82b938392',
                required: false,
                name: 'userPhoneNumber.type',
                type: 'STRING',
              },
              {
                id: 'c81e921f-6962-4707-8519-fbb390abdde9',
                required: false,
                name: 'userPhoneNumber.primary',
                type: 'BOOLEAN',
              },
              {
                id: 'ca26eac3-5724-4d36-9da7-d656cee84b6f',
                required: false,
                name: 'override',
                type: 'BOOLEAN',
              },
              {
                id: 'b6bea60c-8dc9-4bd9-a950-d5f8aa2c6a60',
                required: true,
                name: 'connectorId',
                type: 'STRING',
              },
            ],
          },
        ],
        last: false,
        totalPages: 21,
        totalElements: 206,
        first: true,
        numberOfElements: 10,
        size: 10,
        number: 0,
      },
      config: {},
    }
  )
  addMock(
    {
      method: 'post',
      baseURL: 'https://api.bettercloud.com',
      url: '/v1/actions/04d17606-6601-11e5-9d70-feff819cdc9f/execute',
    },
    {
      status: 200,
      statusText: '200',
      headers: {},
      data: {},
      config: {},
    }
  )
}
