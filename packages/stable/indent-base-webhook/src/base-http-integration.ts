import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { attachMockInterceptors } from './mock-axios'

export type BaseHttpIntegrationOpts = {
  name?: string
  axios?: AxiosInstance
}

export class BaseHttpIntegration {
  _axios: AxiosInstance
  _name?: string

  constructor(props?: BaseHttpIntegrationOpts) {
    if (props) {
      if (props.name) {
        this._name = props.name
      }
      if (props.axios) {
        this._axios = props.axios
      }
    } else {
      this._axios = axios.create()
    }
  }

  Fetch(config: AxiosRequestConfig): Promise<AxiosResponse> {
    // TODO: Add intercepting/replaying in test
    if (process.env.NODE_ENV === 'test' || this._name?.includes('?mock=true')) {
      attachMockInterceptors(this._axios)
    }

    // TODO: Add logging/generic error handling in production
    return this._axios(config)
  }
}
