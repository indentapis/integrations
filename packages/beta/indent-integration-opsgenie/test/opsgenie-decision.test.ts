import { addMock } from '@indent/base-integration'
import { readFileSync } from 'fs'
import path from 'path'
import { OpsgenieDecisionIntegration } from '../lib'
import { OpsgenieDecisionIntegrationOpts } from '../src'

const OPSGENIE_KEY = process.env.OPSGENIE_KEY || ''

const date = new Date().toISOString()
const options: OpsgenieDecisionIntegrationOpts = {
  name: 'testing-opsgenie',
}

const autoApproveInput = {
  events: [
    {
      event: 'access/request',
      actor: {
        id: 'U0ABCDEFGHIJKLMNOP',
        displayName: 'Jane Engineer',
        kind: 'slack/user',
        email: 'jane@example.com',
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
    const integration = new OpsgenieDecisionIntegration()
    const res = await integration.GetDecision(autoApproveInput)

    expect(res.claims).toHaveLength(1)
  })
})

const snapshot = (filename: string) =>
  JSON.parse(readFileSync(path.resolve(__dirname, filename)).toString())

const SNAPSHOT_V2_SCHEDULES = snapshot(
  './snapshots/api-opsgenie-com-v2-schedules-20220409.json'
)
const SNAPSHOT_V2_SCHEDULES_ONCALLS_FLAT = snapshot(
  './snapshots/api-opsgenie-com-v2-schedules-oncalls-20220409.json'
)

function setupMocks() {
  const success = (data: any) => ({
    config: {},
    headers: {},
    status: 200,
    statusText: '200',
    data,
  })

  addMock(
    {
      method: 'get',
      baseURL: 'https://api.opsgenie.com',
      url: `/v2/schedules`,
    },
    success(SNAPSHOT_V2_SCHEDULES)
  )

  addMock(
    {
      method: 'get',
      baseURL: 'https://api.opsgenie.com',
      url: `/v2/schedules/${SNAPSHOT_V2_SCHEDULES.data[0].id}/on-calls?scheduleIdentifierType=name&flat=false`,
    },
    success(SNAPSHOT_V2_SCHEDULES_ONCALLS_FLAT)
  )
}
