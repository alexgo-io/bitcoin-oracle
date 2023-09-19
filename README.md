# AlexB20

## Development Environment

### direnv

This project uses [direnv](https://direnv.net/) to manage environment variables. It also modified the PATH variable in project.
Following description assuming that you have installed direnv and have it configured in your shell. Noting 
that `./node_modules/.bin` is added into $PATH.

### asdf

`.tool-versions` file contains list of tools and their versions used in project. Use [asdf](https://asdf-vm.com/#/) to install them with `asdf install`.

### nx

This project uses [Nx](https://nx.dev/) to manage monorepo. 

### `./tools/bin` directory

This folder contains the development scripts:

- `dev-database`: starts local database
- `dev-stacks`: starts local stacks-node and stacks-node-api


## Validators


