# Silent Planet

Silent Planet is the ultimate discovery platform leveraging geography, classification, and democratic data. This application is built using Vue.js, Three.js, and Vite, and includes Cypress for testing.

## Prerequisites

Before you begin, ensure you have **Node.js** and **Bun** installed on your system. If Bun is not installed, you can find installation instructions on the [official Bun website](https://bun.sh).

## Installation

### Install Bun

Follow the installation instructions for Bun based on your operating system from the official Bun website.

```bash
brew install oven-sh/bun/bun
```

### Install Dependencies

Navigate to your project directory where your \`package.json\` file is located and run:

```bash
bun install
```

This command installs all the necessary dependencies for the project.

## Development

To start the development server, run:

```bash
bun run dev
```

This will serve your application using Vite on a local server.

## Building the Project

To build your application for production, use:

```bash
bun run build
```

## Testing

Run end-to-end tests with Cypress by executing:

```bash
bun run test:e2e
```

For component tests, use:

```bash
bun run test:unit
```

## Linting and Formatting

Ensure your code follows best practices by running the linters and formatters:

```bash
bun run lint
bun run format
```

## Contributing

Contributions to Silent Planet are welcome! Please feel free to submit pull requests or open issues to discuss proposed changes.

### Design Decisions

#### Passing objects by reference

In the codebase, we pass objects by reference when possible. This is a design decision motivated by performance reasons. When an object is instantiated, its initial state is created and passed around by reference. Any updates to that object are made to the original object, which can lead to unexpected behavior if the object is not cloned.

#### Using a singleton for the config

We use a singleton for the config. This is a design decision motivated by the need to access the config from various parts of the application. The config is passed around by reference, and any updates to the config are made to the original object.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Attribution

The starry sky textures are from [NASA](https://svs.gsfc.nasa.gov/4851/).
Starry sky cube creation in https://jaxry.github.io/panorama-to-cubemap/