import { addMock } from '@indent/base-integration'
import { readFileSync } from 'fs'
import path from 'path'
import { PagerdutyDecisionIntegration } from '..'

const now = new Date()
const before = new Date(now.getTime())
before.setSeconds(before.getSeconds() - 30)
const since = before.toISOString()
const later = new Date(now.getTime())
later.setMinutes(later.getMinutes() + 5)
const until = later.toISOString()
const date = now.toISOString()
const autoApproveInput = {
  events: [
    {
      timestamp: date,
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
    const integration = new PagerdutyDecisionIntegration({
      autoApprovedSchedules: ['PI7DH85'],
    })
    const res = await integration.GetDecision(autoApproveInput)

    expect(res.claims).toHaveLength(1)
  })
})

const snapshot = (filename: string) =>
  JSON.parse(readFileSync(path.resolve(__dirname, filename)).toString())

const SNAPSHOT_V2_SCHEDULES = snapshot(
  './snapshots/api-pagerduty-com-v2-schedules-20220412.json'
)
const SNAPSHOT_V2_SCHEDULES_ONCALLS = snapshot(
  './snapshots/api-pagerduty-com-v2-list-users-oncall-20220412.json'
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
      baseURL: 'https://api.pagerduty.com',
      url: `/schedules`,
    },
    success(SNAPSHOT_V2_SCHEDULES)
  )

  addMock(
    {
      method: 'get',
      baseURL: 'https://api.pagerduty.com',
      url: `/schedules/${SNAPSHOT_V2_SCHEDULES.schedules[0].id}/users?since=${since}&until=${until}`,
    },
    success(SNAPSHOT_V2_SCHEDULES_ONCALLS)
  )
}
