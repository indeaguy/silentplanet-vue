# Silent Planet

Silent Planet is the ultimate discovery platform leveraging geography, classification, and democratic data. This application is built using Vue.js, Three.js, and Vite, and includes Cypress for testing.

## Prerequisites

Before you begin, ensure you have Homebrew installed on your macOS. If Homebrew is not installed, you can install it by running the following command in your terminal:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

## Installation

### Install Bun

After installing Homebrew, you can install Bun by running:

```bash
brew install bun
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

## License

This project is licensed under the MIT License - see the LICENSE file for details.
