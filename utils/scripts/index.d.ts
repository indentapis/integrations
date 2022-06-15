export interface CatalogueItem {
  name: string
  runtimes: string[]
  integrations: string[]
  environmentVariables: EnvironmentVariable[] | string[]
  source: string
  artifactBucket: string
  functionKey: string
  depsKey: string
  readme?: {
    connection: string[]
  }
}

interface EnvironmentVariable {
  name: string
  description: string
}
