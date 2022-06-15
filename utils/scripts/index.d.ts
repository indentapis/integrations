export interface CatalogItem {
  name: string
  runtimes: string[]
  integrations: string[]
  environmentVariables: EnvironmentVariable[]
  source: string
  artifactBucket: string
  functionKey: string
  depsKey: string
  readme: {
    connection: string[]
    hasAlternate: boolean
    options: {
      optionOne: {
        name: string
        description: string
      }
      optionTwo: {
        name: string
        description: string
      }
    }
  }
}

interface EnvironmentVariable {
  name: string
  description: string
  alternateValue: boolean
}
