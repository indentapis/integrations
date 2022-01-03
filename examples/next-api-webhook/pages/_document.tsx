import Document, { Head, Html, Main, NextScript } from 'next/document'
import React from 'react'

export default class CustomDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <script
            src="https://cdn.tailwindcss.com"
            type="text/javascript"
            async
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
