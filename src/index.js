#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import { configure } from './commands/configure.js';
import { generateProject } from './commands/generate-project.js';
import { generateBlock } from './commands/generate-block.js';
import { generateModule } from './commands/generate-module.js';
import { generateMicrofrontend } from './commands/generate-microfrontend.js';
import { generateWebsiteMicrofrontend } from './commands/generate-website-microfrontend.js';
import { executor } from './commands/executor.js';

// Create CLI program
const program = new Command();

// Display banner
console.log(chalk.cyan(figlet.textSync('Lux CLI', { horizontalLayout: 'full' })));

// Set version and description
program
  .version('1.0.0')
  .description('A CLI tool for generating MEVN stack projects, views, and API modules');

// Configure command
program
  .command('configure')
  .description('Configure AI provider settings')
  .action(configure);

// Generate project command
program
  .command('generate-project')
  .description('Generate a new MEVN project with frontend and backend')
  .action(generateProject);

// Generate block command
program
  .command('generate-block')
  .description('Generate a new block with frontend and backend modules')
  .action(generateBlock);

// Generate module command
program
  .command('generate-module')
  .description('Generate a new backend module')
  .action(generateModule);

// Generate microfrontend command
program
  .command('generate-microfrontend')
  .description('Generate a new frontend microfrontend')
  .action(generateMicrofrontend);

// Generate website microfrontend command
program
  .command('generate-website-microfrontend')
  .description('Generate a new website page microfrontend with Bootstrap and Fomantic UI versions')
  .action(generateWebsiteMicrofrontend);

// Executor command
program
  .command('executor')
  .description('Execute module generation from a JSON definition file')
  .action(executor);

// Parse command line arguments
program.parse(process.argv);
