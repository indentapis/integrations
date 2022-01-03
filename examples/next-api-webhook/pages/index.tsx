import { useState } from 'react'
import webhook, { getSignaturePayload, sign } from '@indent/webhook'
import { timeStamp } from 'console'

const IndexPage = () => {
  const [state, setState] = useState({
    data: null,
    __html: 'Click one of the buttons above to load data',
  })
  function callWebhook({ data = {}, headers = {} }) {
    const body = JSON.stringify(data)
    const timestamp = new Date().toISOString()
    const payload = getSignaturePayload({
      timestamp,
      body,
    })
    setState({ __html: 'Loading...', data })
    sign({ secret: 's123', payload }).then((signature) => {
      fetch('/api/webhook', {
        method: 'POST',
        body,
        headers: {
          ...headers,
          'X-Indent-Timestamp': timestamp,
          'X-Indent-Signature': signature,
        },
      })
        .then((r) => r.json())
        .then((resData) => {
          console.log('webhook: response', { data: resData })
          setState({ __html: JSON.stringify(resData, null, 2), data })
        })
    })
  }
  return (
    <div className="p-8">
      <strong className="block mb-2">Looking for the webhook endpoint?</strong>
      <a
        href="/api/webhook"
        className="inline-block items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <code>/api/webhook</code> &rarr;
      </a>
      <div className="mt-6 pt-6 border-t text-gray-400">
        <button
          className="inline-flex mr-2 font-semibold items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onClick={() => callWebhook({ data: { info: true } })}
        >
          Get info from webhook
        </button>
        {' | '}
        <button
          className="inline-flex ml-2 mr-2 font-semibold items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onClick={() =>
            callWebhook({ data: { events: [{ event: 'access/grant' }] } })
          }
        >
          Test: Apply
        </button>
        <button
          className="inline-flex mr-2 font-semibold items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onClick={() => callWebhook({ data: { kinds: ['example.v1.group'] } })}
        >
          Test: Pull
        </button>
        {' | '}
        <button
          className="inline-flex ml-2 mr-2 font-semibold items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onClick={() =>
            callWebhook({ data: { events: [{ event: 'access/request' }] } })
          }
        >
          Test: Decide
        </button>
        <div className="max-w-4xl border text-black border-b-0 mt-6 shadow-lg font-mono bg-gray-50 overflow-hidden rounded-lg">
          <div className="flex justify-between bg-white border-b py-3 px-6">
            <div className="w-full text-center px-32 py-1 bg-gray-200 text-xs rounded-md">
              /api/webhook
            </div>
          </div>
          <div className="border-b p-6">
            <h4 className="font-sans uppercase text-xs text-gray-600 mb-6">
              Request
            </h4>
            <pre
              dangerouslySetInnerHTML={{
                __html: JSON.stringify(state.data, null, 2),
              }}
            ></pre>
          </div>
          <div className="p-6 bg-blue-50">
            <h4 className="font-sans uppercase text-xs text-gray-600 mb-6">
              Response
            </h4>
            <pre dangerouslySetInnerHTML={{ __html: state.__html }}></pre>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IndexPage
