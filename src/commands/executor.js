import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  ensureDirectoryExists,
  executeGeneratorScript,
  checkModuleExists
} from '../utils/project.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function executor() {
  console.log(chalk.cyan('\n⚡ Module Generator Executor\n'));

  try {
    // Get project path
    const { projectPath } = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectPath',
        message: 'Enter the project root path (default: current directory):',
        default: './',
      }
    ]);

    const absolutePath = resolve(process.cwd(), projectPath);
    const frontendPath = join(absolutePath, 'frontend');
    const backendPath = join(absolutePath, 'backend');

    // Get JSON file path
    const { jsonPath } = await inquirer.prompt([
      {
        type: 'input',
        name: 'jsonPath',
        message: 'Enter the path to your JSON definition file:',
        validate: async (input) => {
          if (input.trim() === '') return 'Path is required';
          try {
            const fullPath = resolve(process.cwd(), input);
            await ensureDirectoryExists(join(fullPath, '..'));
            return true;
          } catch {
            return 'Invalid path';
          }
        }
      }
    ]);

    // Get generation type
    const { generationType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'generationType',
        message: 'What would you like to generate?',
        choices: [
          { name: 'Both Frontend and Backend (default)', value: 'both' },
          { name: 'Backend Only', value: 'backend' },
          { name: 'Frontend Only', value: 'frontend' }
        ],
        default: 'both'
      }
    ]);

    const spinner = ora('Reading configuration...').start();
    const config = require(resolve(process.cwd(), jsonPath));
    spinner.succeed('Configuration loaded');

    // Generate backend if requested
    if (generationType === 'both' || generationType === 'backend') {
      const backendModulePath = join(backendPath, 'src/modules', config.name);
      
      if (await checkModuleExists(backendModulePath)) {
        const { overwrite } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'overwrite',
            message: `Module ${config.name} already exists in backend. Overwrite?`,
            default: false
          }
        ]);
        if (!overwrite) {
          console.log(chalk.yellow(`\nSkipping backend module generation for ${config.name}`));
        } else {
          spinner.start('Generating backend module...');
          await executeGeneratorScript(
            resolve(__dirname, '../../generator-cli.js'),
            jsonPath,
            { cwd: backendPath }
          );
          spinner.succeed('Backend module generated');
        }
      } else {
        spinner.start('Generating backend module...');
        await executeGeneratorScript(
          resolve(__dirname, '../../generator-cli.js'),
          jsonPath,
          { cwd: backendPath }
        );
        spinner.succeed('Backend module generated');
      }
    }

    // Generate frontend if requested
    if (generationType === 'both' || generationType === 'frontend') {
      const frontendModulePath = join(frontendPath, 'src/_frontends/dashboard', config.name);
      
      if (await checkModuleExists(frontendModulePath)) {
        const { overwrite } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'overwrite',
            message: `Module ${config.name} already exists in frontend. Overwrite?`,
            default: false
          }
        ]);
        if (!overwrite) {
          console.log(chalk.yellow(`\nSkipping frontend module generation for ${config.name}`));
        } else {
          spinner.start('Generating frontend module...');
          await executeGeneratorScript(
            resolve(__dirname, '../../create-microfrontend.js'),
            jsonPath,
            { cwd: frontendPath }
          );
          spinner.succeed('Frontend module generated');
        }
      } else {
        spinner.start('Generating frontend module...');
        await executeGeneratorScript(
          resolve(__dirname, '../../create-microfrontend.js'),
          jsonPath,
          { cwd: frontendPath }
        );
        spinner.succeed('Frontend module generated');
      }
    }

    console.log(chalk.green('\n✨ Generation completed successfully!'));
    console.log(chalk.cyan('\nGenerated files:'));
    if (generationType === 'both' || generationType === 'backend') {
      console.log(chalk.white(`├── backend/src/modules/${config.name}/`));
    }
    if (generationType === 'both' || generationType === 'frontend') {
      console.log(chalk.white(`└── frontend/src/_frontends/dashboard/${config.name}/`));
    }

    console.log(chalk.cyan('\nNext steps:'));
    if (generationType === 'both' || generationType === 'frontend') {
      console.log('1. Add the new module to your router configuration');
      console.log('2. Import and register any required components');
    }
    if (generationType === 'both' || generationType === 'backend') {
      console.log('3. Add the new module to your API routes');
    }
    console.log('4. Restart your development servers to apply changes');

  } catch (error) {
    console.error(chalk.red('\n❌ Error executing generator:'), error.message);
    process.exit(1);
  }
}
