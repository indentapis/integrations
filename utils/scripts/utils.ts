export interface CatalogueItem {
  name: string
  environmentVariables: string[]
  source: string
  artifactBucket: string
  functionKey: string
  depsKey: string
}
