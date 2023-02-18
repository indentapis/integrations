import { addMock } from '@indent/base-integration'
import { readFileSync } from 'fs'
import path from 'path'
import { IncidentioDecisionIntegration } from '../lib'

const date = new Date().toISOString()
const autoApproveInput = {
  events: [
    {
      event: 'access/request',
      actor: {
        id: 'U0ABCDEFGHIJKLMNOP',
        displayName: 'Lisa Engineer',
        kind: 'slack/user',
        email: 'lisa@incident.io',
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
  it('should respond with auto approval', async () => {
    const integration = new IncidentioDecisionIntegration({
      autoApprovedRoles: ['Incident Lead'],
    })
    const res = await integration.GetDecision(autoApproveInput)

    expect(res.claims).toHaveLength(1)
  })

  it('should not respond with auto approval', async () => {
    const integration = new IncidentioDecisionIntegration({
      autoApprovedRoles: ['Incident Lead'],
    })
    const res = await integration.GetDecision({
      events: [
        {
          ...autoApproveInput.events[0],
          actor: {
            email: 'other@user.com',
          },
        },
      ],
    })

    expect(res.claims).toHaveLength(0)
  })
})

const snapshot = (filename: string) =>
  JSON.parse(readFileSync(path.resolve(__dirname, filename)).toString())

const SNAPSHOT_V1_INCIDENTS = snapshot(
  './snapshots/api-incident-io-v1-list-incidents-20220818.json'
)

function setupMocks() {
  const success = (data: any) => ({
    config: {},
    headers: {
      'Content-Type': 'application/json',
    },
    status: 200,
    statusText: 'OK',
    data,
  })

  addMock(
    {
      method: 'get',
      baseURL: 'https://api.incident.io',
      url: `/v1/incidents`,
    },
    success(SNAPSHOT_V1_INCIDENTS)
  )
}
