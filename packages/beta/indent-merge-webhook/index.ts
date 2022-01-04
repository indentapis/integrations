import {
  HealthCheckResponse,
  IntegrationInfo,
  PullIntegration,
  PullUpdateRequest,
} from '@indent/base-webhook'
import { PullUpdateResponse } from '@indent/types'
import axios from 'axios'
import pkg from './package.json'

export class MergeIntegration implements PullIntegration {
  _name?: string

  constructor(opts?: { name: string }) {
    if (opts) {
      this._name = opts.name
    }
  }

  HealthCheck(): HealthCheckResponse {
    return { status: { code: 0 } }
  }

  GetInfo(): IntegrationInfo {
    return {
      name: ['indent-merge-webhook', this._name].filter(Boolean).join('#'),
      capabilities: ['PullUpdate'],
      version: pkg.version,
    }
  }

  MatchPull(req: PullUpdateRequest): boolean {
    return req.kinds.map((k) => k.toLowerCase()).includes('example.v1.group')
  }

  async PullUpdate(_req: PullUpdateRequest): Promise<PullUpdateResponse> {
    return {
      resources: await axios({
        url: '/employees',
      }).then((r) => {
        return r.data.results.map((r) => ({
          id: r.id,
          kind: 'merge.v1.Employee',
          displayName: r.display_full_name,
          email: r.work_email,
        }))
      }),
    }
  }
}
