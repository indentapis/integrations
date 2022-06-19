export interface CatalogItem {
  name: string
  runtimes: string[]
  integrations: string[]
  environmentVariables: string[]
  source: string
  artifactBucket: string
  functionKey: string
  depsKey: string
  readme: {
    connection: string[]
    docsLink: string
  }
}
