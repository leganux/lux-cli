import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generateModuleRunner } from '../utils/ai.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
import {
  ensureDirectoryExists,
  saveModuleRunner,
  executeGeneratorScript,
  checkModuleExists
} from '../utils/project.js';

export async function generateBlock() {
  console.log(chalk.cyan('\n🧩 Generating New Block\n'));

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
    const runnersPath = join(absolutePath, 'generated_runners');

    // Verify project structure
    const spinner = ora('Verifying project structure...').start();
    try {
      await Promise.all([
        ensureDirectoryExists(frontendPath),
        ensureDirectoryExists(backendPath),
        ensureDirectoryExists(runnersPath)
      ]);
      spinner.succeed('Project structure verified');
    } catch (error) {
      spinner.fail('Invalid project structure');
      console.error(chalk.red('Error: Expected frontend/ and backend/ directories in project root'));
      process.exit(1);
    }

    // Get block description
    const { description, name } = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Enter the block name (in singular form, e.g., "product"):',
        validate: (input) => {
          if (input.trim() === '') return 'Name is required';
          if (!/^[a-z][a-z0-9]*$/.test(input)) {
            return 'Name must start with a lowercase letter and contain only letters and numbers';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'description',
        message: 'Describe this block and its requirements:',
        validate: (input) => input.trim() !== '' || 'Description is required'
      }
    ]);

    // Generate module runner
    spinner.start('Generating block configuration...');
    const config = await generateModuleRunner(name, description);
    const runnerPath = await saveModuleRunner(config, runnersPath);
    spinner.succeed('Block configuration generated');

    // Check if module already exists in backend
    const backendModulePath = join(backendPath, 'src/modules', name);
    if (await checkModuleExists(backendModulePath)) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: `Module ${name} already exists in backend. Overwrite?`,
          default: false
        }
      ]);
      if (!overwrite) {
        console.log(chalk.yellow(`Skipping backend module generation for ${name}`));
      } else {
        // Generate backend module
        spinner.start(`Generating backend module...`);
        await executeGeneratorScript(
          resolve(__dirname, '../../generator-cli.js'),
          runnerPath,
          { cwd: backendPath }
        );
        spinner.succeed('Backend module generated');
      }
    } else {
      // Generate backend module
      spinner.start(`Generating backend module...`);
      await executeGeneratorScript(
        resolve(__dirname, '../../generator-cli.js'),
        runnerPath,
        { cwd: backendPath }
      );
      spinner.succeed('Backend module generated');
    }

    // Check if module already exists in frontend
    const frontendModulePath = join(frontendPath, 'src/_frontends/dashboard', name);
    if (await checkModuleExists(frontendModulePath)) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: `Module ${name} already exists in frontend. Overwrite?`,
          default: false
        }
      ]);
      if (!overwrite) {
        console.log(chalk.yellow(`Skipping frontend module generation for ${name}`));
      } else {
        // Generate frontend module
        spinner.start(`Generating frontend module...`);
        await executeGeneratorScript(
          resolve(__dirname, '../../create-microfrontend.js'),
          runnerPath,
          { cwd: frontendPath }
        );
        spinner.succeed('Frontend module generated');
      }
    } else {
      // Generate frontend module
      spinner.start(`Generating frontend module...`);
      await executeGeneratorScript(
        resolve(__dirname, '../../create-microfrontend.js'),
        runnerPath,
        { cwd: frontendPath }
      );
      spinner.succeed('Frontend module generated');
    }

    console.log(chalk.green('\n✨ Block generated successfully!'));
    console.log(chalk.cyan('\nGenerated files:'));
    console.log(chalk.white(`├── frontend/src/_frontends/dashboard/${name}/`));
    console.log(chalk.white(`├── backend/src/modules/${name}/`));
    console.log(chalk.white(`└── generated_runners/${name}.runner.json`));

    console.log(chalk.cyan('\nNext steps:'));
    console.log('1. Review the generated configuration in:');
    console.log(chalk.white(`   generated_runners/${name}.runner.json`));
    console.log('2. Add the new module to your router configuration');
    console.log('3. Import and register any required components');
    console.log('4. Restart your development servers to apply changes');

  } catch (error) {
    console.error(chalk.red('\n❌ Error generating block:'), error.message);
    process.exit(1);
  }
}
