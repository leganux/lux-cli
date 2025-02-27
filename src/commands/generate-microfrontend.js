import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { join, resolve } from 'path';
import { generateModuleRunner } from '../utils/ai.js';
import {
  ensureDirectoryExists,
  saveModuleRunner,
  executeGeneratorScript,
  checkModuleExists
} from '../utils/project.js';

export async function generateMicrofrontend() {
  console.log(chalk.cyan('\n🎨 Generating New Microfrontend\n'));

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
    const runnersPath = join(absolutePath, 'generated_runners');

    // Verify project structure
    const spinner = ora('Verifying project structure...').start();
    try {
      await Promise.all([
        ensureDirectoryExists(frontendPath),
        ensureDirectoryExists(runnersPath)
      ]);
      spinner.succeed('Project structure verified');
    } catch (error) {
      spinner.fail('Invalid project structure');
      console.error(chalk.red('Error: Expected frontend/ directory in project root'));
      process.exit(1);
    }

    // Get microfrontend details
    const { description, name } = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Enter the microfrontend name (in singular form, e.g., "product"):',
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
        message: 'Describe this microfrontend and its requirements:',
        validate: (input) => input.trim() !== '' || 'Description is required'
      }
    ]);

    // Generate module runner
    spinner.start('Generating microfrontend configuration...');
    const config = await generateModuleRunner(name, description);
    const runnerPath = await saveModuleRunner(config, runnersPath);
    spinner.succeed('Microfrontend configuration generated');

    // Check if microfrontend already exists
    const frontendModulePath = join(frontendPath, 'src/_frontends/dashboard', name);
    if (await checkModuleExists(frontendModulePath)) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: `Microfrontend ${name} already exists. Overwrite?`,
          default: false
        }
      ]);
      if (!overwrite) {
        console.log(chalk.yellow(`\nSkipping microfrontend generation for ${name}`));
        return;
      }
    }

    // Generate frontend module
    spinner.start(`Generating microfrontend...`);
    await executeGeneratorScript(
      resolve(process.cwd(), 'create-microfrontend.js'),
      runnerPath,
      { cwd: frontendPath }
    );
    spinner.succeed('Microfrontend generated');

    console.log(chalk.green('\n✨ Microfrontend generated successfully!'));
    console.log(chalk.cyan('\nGenerated files:'));
    console.log(chalk.white(`├── frontend/src/_frontends/dashboard/${name}/`));
    console.log(chalk.white(`└── generated_runners/${name}.runner.json`));

    console.log(chalk.cyan('\nNext steps:'));
    console.log('1. Review the generated configuration in:');
    console.log(chalk.white(`   generated_runners/${name}.runner.json`));
    console.log('2. Add the new microfrontend to your router configuration');
    console.log('3. Import and register any required components');
    console.log('4. Restart your frontend development server to apply changes');

  } catch (error) {
    console.error(chalk.red('\n❌ Error generating microfrontend:'), error.message);
    process.exit(1);
  }
}
