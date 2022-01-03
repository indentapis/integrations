import { useState } from 'react'
import webhook, { getSignaturePayload, sign } from '@indent/webhook'
import { timeStamp } from 'console'

const IndexPage = () => {
  const [state, setState] = useState({
    __html: 'Click a button above to load data',
  })
  function callWebhook({ data = {}, headers = {} }) {
    const body = JSON.stringify(data)
    const timestamp = new Date().toISOString()
    const payload = getSignaturePayload({
      timestamp,
      body,
    })
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
        .then((data) => {
          console.log('webhook: response', { data })
          setState({ __html: JSON.stringify(data, null, 2) })
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
      <div className="mt-6 pt-6 border-t">
        <button
          className="inline-flex mr-2 font-bold items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onClick={() => {
            setState({ __html: 'Loading...' })
            callWebhook({
              data: { info: true },
            })
          }}
        >
          Get info from webhook
        </button>
        <button
          className="inline-flex mr-2 font-bold items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onClick={() => {
            setState({ __html: 'Loading...' })
            callWebhook({
              data: {
                events: [
                  {
                    event: 'access/grant',
                  },
                ],
              },
            })
          }}
        >
          Test: Apply
        </button>
        <button
          className="inline-flex font-bold items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          onClick={() => {
            setState({ __html: 'Loading...' })
            callWebhook({
              data: {
                kinds: ['example.v1.group'],
              },
            })
          }}
        >
          Test: Pull
        </button>
        <pre
          className="mt-6 font-mono p-6 bg-gray-100 rounded-lg"
          dangerouslySetInnerHTML={{ __html: state.__html }}
        ></pre>
      </div>
    </div>
  )
}

export default IndexPage
