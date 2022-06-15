export interface CatalogItem {
  name: string
  integrations: string[]
  environmentVariables: string[]
  source: string
  artifactBucket: string
  functionKey: string
  depsKey: string
}
