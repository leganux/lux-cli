# Lux CLI

A powerful CLI tool for generating MEVN (MongoDB, Express, Vue 3, Node.js) stack projects, views, and API modules. This tool helps you quickly scaffold new projects and generate modules with AI-powered code generation.

## Features

- 🚀 Generate complete MEVN stack projects
- 🧩 Create individual blocks with frontend and backend components
- 📦 Generate backend-only modules
- 🎨 Create frontend-only microfrontends
- 🌐 Generate website pages with dual UI framework support
- ⚡ Execute module generation from JSON definitions
- 🤖 AI-powered code generation (OpenAI or Deepseek)
- 🎯 TypeScript support out of the box
- 🔄 Vue 3 Composition API
- 📊 MongoDB with Mongoose

## Installation

```bash
# Install globally
npm  install  -g leganux-lux-cli
____________________________________________
                   OR
_______________________________________
# Clone the repository
git clone https://github.com/yourusername/lux-cli.git

# Navigate to the directory
cd leganux-lux-cli

# Install dependencies
npm install

# Link the CLI globally
npm link
```

## Commands

### Configure AI Provider

Set up your AI provider (OpenAI or Deepseek) for code generation:

```bash
lux configure
```

This will:
- Create a .lux directory in your home folder
- Store your AI provider preference and API key
- Use these settings for all future code generation

### Generate Complete Project

Create a new MEVN stack project with both frontend and backend:

```bash
lux generate-project
```

This will:
- Create frontend and backend directories
- Download and set up Vue 3 microfrontends template
- Download and set up Express TypeScript backend template
- Generate AI-powered module definitions
- Create all necessary modules and components

### Generate Block

Create a new block with both frontend and backend components:

```bash
lux generate-block
```

This will:
- Generate a module configuration based on your description
- Create backend API module with TypeScript and Mongoose
- Create frontend Vue 3 component with TypeScript
- Set up all necessary files and configurations

### Generate Backend Module

Create a new backend-only module:

```bash
lux generate-module
```

This will:
- Generate a module configuration based on your description
- Create a complete backend module with:
  - TypeScript interfaces
  - Mongoose model
  - Express controller
  - API routes
  - Swagger documentation

### Generate Frontend Microfrontend

Create a new frontend-only microfrontend:

```bash
lux generate-microfrontend
```

This will:
- Generate a module configuration based on your description
- Create a complete Vue 3 microfrontend with:
  - TypeScript interfaces
  - Vue 3 components (Bootstrap and Fomantic UI)
  - Vuex store
  - API service
  - Configuration

### Generate Website Page

Create a new website page with both Bootstrap and Fomantic UI versions:

```bash
lux generate-website-microfrontend
```

This will:
- Ask for project root path
- Get module name and view name
- Take a description of the desired page
- Create proper directory structure in frontend/src/_frontends/website/
- Generate config.ts with proper routing setup
- Use AI to generate:
  - Bootstrap version of the page
  - Fomantic UI version of the page
- Follow Vue 3 Composition API best practices
- Include TypeScript support
- Set up proper routing configuration

The generated website pages will include:
- Responsive design
- Semantic HTML structure
- Proper component organization
- Scoped styling
- TypeScript type definitions
- Framework-specific UI components and classes

### Execute from JSON

Generate modules from an existing JSON definition:

```bash
lux executor
```

This will:
- Read your JSON module definition
- Generate backend and/or frontend code based on your choice
- Support for custom module definitions

## Project Structure

Generated projects follow this structure:

```
your-project/
├── frontend/                 # Vue 3 frontend
│   └── src/
│       └── _frontends/
│           ├── dashboard/   # Dashboard microfrontends
│           └── website/     # Website pages
├── backend/                  # Express backend
│   └── src/
│       └── modules/         # API modules
└── generated_runners/       # Generated JSON configurations
```

## Development

To contribute to the CLI:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

ISC

## TODO

- [ ] Add support for additional frontend frameworks
- [ ] Enhance AI-powered code generation
- [ ] Add testing utilities
