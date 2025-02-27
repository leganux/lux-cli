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

export async function generateModule() {
  console.log(chalk.cyan('\n📦 Generating New Backend Module\n'));

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
    const backendPath = join(absolutePath, 'backend');
    const runnersPath = join(absolutePath, 'generated_runners');

    // Verify project structure
    const spinner = ora('Verifying project structure...').start();
    try {
      await Promise.all([
        ensureDirectoryExists(backendPath),
        ensureDirectoryExists(runnersPath)
      ]);
      spinner.succeed('Project structure verified');
    } catch (error) {
      spinner.fail('Invalid project structure');
      console.error(chalk.red('Error: Expected backend/ directory in project root'));
      process.exit(1);
    }

    // Get module details
    const { description, name } = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Enter the module name (in singular form, e.g., "product"):',
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
        message: 'Describe this module and its requirements:',
        validate: (input) => input.trim() !== '' || 'Description is required'
      }
    ]);

    // Generate module runner
    spinner.start('Generating module configuration...');
    const config = await generateModuleRunner(name, description);
    const runnerPath = await saveModuleRunner(config, runnersPath);
    spinner.succeed('Module configuration generated');

    // Check if module already exists
    const backendModulePath = join(backendPath, 'src/modules', name);
    if (await checkModuleExists(backendModulePath)) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: `Module ${name} already exists. Overwrite?`,
          default: false
        }
      ]);
      if (!overwrite) {
        console.log(chalk.yellow(`\nSkipping module generation for ${name}`));
        return;
      }
    }

    // Generate backend module
    spinner.start(`Generating module...`);
    await executeGeneratorScript(
      resolve(__dirname, '../../generator-cli.js'),
      runnerPath,
      { cwd: backendPath }
    );
    spinner.succeed('Module generated');

    console.log(chalk.green('\n✨ Module generated successfully!'));
    console.log(chalk.cyan('\nGenerated files:'));
    console.log(chalk.white(`├── backend/src/modules/${name}/`));
    console.log(chalk.white(`└── generated_runners/${name}.runner.json`));

    console.log(chalk.cyan('\nNext steps:'));
    console.log('1. Review the generated configuration in:');
    console.log(chalk.white(`   generated_runners/${name}.runner.json`));
    console.log('2. Add the new module to your API routes');
    console.log('3. Restart your backend server to apply changes');

  } catch (error) {
    console.error(chalk.red('\n❌ Error generating module:'), error.message);
    process.exit(1);
  }
}
