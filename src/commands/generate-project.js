import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { generateModulesList, generateModuleRunner } from '../utils/ai.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
import {
  checkGitInstalled,
  downloadAndExtract,
  ensureDirectoryExists,
  saveModuleRunner,
  executeGeneratorScript,
  checkModuleExists
} from '../utils/project.js';

const FRONTEND_REPO = {
  zip: 'https://github.com/leganux/leganux-vue3-microfrontends/archive/refs/heads/main.zip',
  git: 'https://github.com/leganux/leganux-vue3-microfrontends.git'
};

const BACKEND_REPO = {
  zip: 'https://github.com/leganux/express-ts-base/archive/refs/heads/main.zip',
  git: 'https://github.com/leganux/express-ts-base.git'
};

export async function generateProject() {
  console.log(chalk.cyan('\n🚀 Generating New MEVN Project\n'));

  try {
    // Get project path
    const { projectPath } = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectPath',
        message: 'Enter the project path (default: current directory):',
        default: './',
      }
    ]);

    const absolutePath = resolve(process.cwd(), projectPath);
    const frontendPath = join(absolutePath, 'frontend');
    const backendPath = join(absolutePath, 'backend');
    const runnersPath = join(absolutePath, 'generated_runners');

    // Create directories
    const spinner = ora('Creating project directories...').start();
    await ensureDirectoryExists(frontendPath);
    await ensureDirectoryExists(backendPath);
    await ensureDirectoryExists(runnersPath);
    spinner.succeed('Project directories created');

    // Check Git availability
    const gitInstalled = await checkGitInstalled();
    
    // Download frontend template
    spinner.start('Downloading frontend template...');
    await downloadAndExtract(
      gitInstalled ? FRONTEND_REPO.git : FRONTEND_REPO.zip,
      frontendPath,
      !gitInstalled
    );
    spinner.succeed('Frontend template downloaded');

    // Download backend template
    spinner.start('Downloading backend template...');
    await downloadAndExtract(
      gitInstalled ? BACKEND_REPO.git : BACKEND_REPO.zip,
      backendPath,
      !gitInstalled
    );
    spinner.succeed('Backend template downloaded');

    // Get project description
    const { description } = await inquirer.prompt([
      {
        type: 'input',
        name: 'description',
        message: 'Describe your project and its requirements:',
        validate: (input) => input.trim() !== '' || 'Description is required'
      }
    ]);

    // Generate modules list
    spinner.start('Analyzing project requirements...');
    const modules = await generateModulesList(description);
    spinner.succeed('Project analysis complete');
    console.log(chalk.cyan('\nIdentified modules:'), modules);

    // Generate runners for each module
    spinner.start('Generating module configurations...');
    for (const moduleName of modules) {
      const config = await generateModuleRunner(moduleName, description);
      const runnerPath = await saveModuleRunner(config, runnersPath);
      console.log(chalk.green(`✓ Generated configuration for ${moduleName}`));

      // Check if module already exists
      const backendModulePath = join(backendPath, 'src/modules', moduleName);
      const frontendModulePath = join(frontendPath, 'src/_frontends/dashboard', moduleName);

      if (await checkModuleExists(backendModulePath)) {
        const { overwrite } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'overwrite',
            message: `Module ${moduleName} already exists in backend. Overwrite?`,
            default: false
          }
        ]);
        if (!overwrite) continue;
      }

      // Generate backend module
      spinner.start(`Generating backend module for ${moduleName}...`);
      await executeGeneratorScript(
        resolve(__dirname, '../../generator-cli.js'),
        runnerPath,
        { cwd: backendPath }
      );
      spinner.succeed(`Backend module for ${moduleName} generated`);

      // Generate frontend module
      if (await checkModuleExists(frontendModulePath)) {
        const { overwrite } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'overwrite',
            message: `Module ${moduleName} already exists in frontend. Overwrite?`,
            default: false
          }
        ]);
        if (!overwrite) continue;
      }

      spinner.start(`Generating frontend module for ${moduleName}...`);
      await executeGeneratorScript(
        resolve(__dirname, '../../create-microfrontend.js'),
        runnerPath,
        { cwd: frontendPath }
      );
      spinner.succeed(`Frontend module for ${moduleName} generated`);
    }

    console.log(chalk.green('\n✨ Project generated successfully!'));
    console.log(chalk.cyan('\nProject structure:'));
    console.log(chalk.white('├── frontend/'));
    console.log(chalk.white('├── backend/'));
    console.log(chalk.white('└── generated_runners/'));
    
    console.log(chalk.cyan('\nNext steps:'));
    console.log('1. Navigate to the backend directory and run:');
    console.log(chalk.white('   npm install'));
    console.log(chalk.white('   npm run dev'));
    console.log('\n2. Navigate to the frontend directory and run:');
    console.log(chalk.white('   npm install'));
    console.log(chalk.white('   npm run dev'));

  } catch (error) {
    console.error(chalk.red('\n❌ Error generating project:'), error.message);
    process.exit(1);
  }
}
