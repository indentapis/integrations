# Indent Integrations

Off-the-shelf integrations for using Indent with third-party APIs.

### Requirements

- [Node.js](https://nodejs.org) `v14.16+`
- [Yarn](https://yarnpkg.com) `v1.22+`

### Getting Started

This repo stores the majority of the integrations that Indent currently supports. It's organized as a monorepo that uses [Lerna](https://lerna.js.org) and [Turborepo](https://turborepo.com) to manage packages, each deployed as their own npm modules.

Once you have the system requirements installed, you can clone the repo:

```bash
git clone https://github.com/indentapis/integrations && cd integrations
yarn
```

To configure your project, by linking all the modules together:

```bash
yarn configure # installs dependencies and bootstrap symlinks
# or
yarn bootstrap # just relink all the modules
```

Now when you make changes and re-compile, the modules will pull the new code. You can compile by running:

```bash
yarn compile
# or watch for file changes
yarn dev
```

### Contributing

All individual integrations are stored in the `packages/` directory. The modules are organized by the release stage: `stable`, `beta` and `alpha`. If you want to add a new webhook integration, run the following command:

```bash
cd packages/beta
npx create-example-app -r indentapis/integrations -e new-integration
```

Or if you want to create a new custom integration in your own directory:

```bash
npx create-example-app -r indentapis/integrations -e new-integration
```
