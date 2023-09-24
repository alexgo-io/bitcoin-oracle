# AlexB20

## Introduction

this is a monorepo for AlexB20 project. It contains following apps:

- api-server[./packages/apps/api-server/]
  - api-server is a nodejs server that provides REST API for the project. It uses [NestJS](https://nestjs.com/) framework.
- bitcoin-sync[./packages/apps/bitcoin-sync/]
  - bitcoin-sync is a worker that syncs bitcoin header info for quick access for validators and relayers.
- relayer[./packages/apps/relayer/]
  - relayer is a used for submitting the proofs from validator to stacks-node.
- validator[./packages/apps/validator/]
  - validator is a worker that validates b20 transaction, bitcoin headers and submits the proofs to api-server.

## Getting Started

### Run Validator in Docker

- TODO: add instructions for running validator in docker

### Prerequisites

#### Development Environment

#### direnv

This project uses [direnv](https://direnv.net/) to manage environment variables. It also modified the PATH variable in project.
Following description assuming that you have installed direnv and have it configured in your shell. Noting
that `./node_modules/.bin` is added into $PATH.

#### asdf

`.tool-versions` file contains list of tools and their versions used in project. Use [asdf](https://asdf-vm.com/#/) to install them with `asdf install`.

#### nx

This project uses [Nx](https://nx.dev/) to manage monorepo. nx is installed as devDependency in project.
With direnv, you can use `nx` command directly without `npx nx`.

#### `./tools/bin` directory

This folder contains the custom development scripts, such as:

- `dev-database`:
  - starts local database
  - it will create the database and run the migrations
- `dev-stacks`:
  - starts local stacks-node and stacks-node-api
  - it will deploy the contracts and run setup transactions

### Installation

```bash
direnv allow
pnpm install
```

### Environment Variables

create `.envrc.override` file in project root directory and add set necessary environment variables, such as:

```bash
export OK_ACCESS_KEY=""
export BIS_ACCESS_KEY=""
export STACKS_VALIDATOR_ACCOUNT_ADDRESS=""
export STACKS_VALIDATOR_ACCOUNT_SECRET=""
```

### Start Environment

```bash
dev-database
dev-stacks
```

### Start Apps

```bash
nx serve api-server
nx serve bitcoin-sync
nx serve validator
nx serve relayer
```

## Validator

Validator under `packages/apps/validator` folder is a worker that validates b20 transaction, bitcoin headers and submits the proofs to api-server.
It dynamically loads the module which implements the [`ValidatorProcessInterface`](packages/libs/validator/src/validator-module/validator-process.interface.ts) interface.

### Validator Process

Validator module which implements the follow interface will be able to be loaded by validator worker.

```typescript
export abstract class ValidatorProcessInterface {
  abstract processBlock$(block: number): Observable<unknown>;
}
```

Services that implements the validator process interface:

- [validator-bis](packages/libs/validator-bis/src/module/validator-bis.service.ts)
- [validator-hiro](packages/libs/validator-hiro/src/module/validator-hiro.service.ts)
