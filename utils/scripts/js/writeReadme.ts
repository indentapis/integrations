// import fs from 'fs'
// import Mustache from 'mustache'
// import { CatalogueItem, EnvironmentVariable } from '..'

// // const currentIntegration = catalogue.filter((item) =>
// //   WEBHOOK_DIR.toLowerCase().includes(item.name.toLowerCase())
// // )

// export const writeReadme = (item: CatalogueItem) => {
//   if (!item.name.includes('okta')) {
//     return
//   }
//   const WEBHOOK_DIR =
//     process.env.WEBHOOK_DIR || 'tmp/examples/indent-example-webhook'
//   // import template from file
//   const template = fs.readFileSync(WEBHOOK_DIR + '/README.example.md', 'utf-8')

//   // destructure catalogueItem
//   const { name, runtimes, integrations, environmentVariables, readme } = item

//   let formattedConnection = ['']

//   if (readme?.connection) {
//     const { connection } = readme
//     formattedConnection = connection.map((step) => {
//       return (step = '<li> ' + step + ' </li>')
//     })
//   }

//   // join environment variables in HTML
//   const optionTwoEntries = readme.hasAlternate
//     ? {
//         name: readme.options.optionTwo.name,
//         description: readme.options.optionTwo.description,
//         entries: environmentVariables
//           .map((e) => `<tr><td>${e.name}</td><td>${e.description}</td></tr>`)
//           .join(''),
//       }
//     : false
//   // render template
//   const rendered = Mustache.render(template, {
//     runtime: runtimes[0],
//     integration: name,
//     numIntegrations: integrations.length,
//     connection: formattedConnection.join(''),
//     optionOne: {
//       name: readme.options.optionOne.name,
//       description: readme.options.optionOne.description,
//       entries: environmentVariables
//         .filter((e: EnvironmentVariable) => !e.alternateValue)
//         .map((e) => `<tr><td>${e.name}</td><td>${e.description}</td></tr>`)
//         .join(''),
//     },
//     optionTwo: optionTwoEntries,
//   })

//   fs.writeFileSync('../README.md', rendered, 'utf-8')
// }
