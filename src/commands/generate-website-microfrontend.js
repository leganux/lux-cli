import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { join, resolve } from 'path';
import OpenAI from 'openai';
import { promises as fs } from 'fs';
import { homedir } from 'os';
import fetch from 'node-fetch';

const CONFIG_FILE = join(homedir(), '.lux', 'config.json');

async function getConfig() {
  try {
    const configData = await fs.readFile(CONFIG_FILE, 'utf8');
    return JSON.parse(configData);
  } catch (error) {
    console.error(chalk.red('Error reading config:'), error);
    throw new Error('Please run "lux configure" first to set up your AI provider');
  }
}

async function callAI(prompt, model = 'gpt-4o') {
  const config = await getConfig();
  
  try {
    if (config.aiProvider === 'openai') {
      const openai = new OpenAI({
        apiKey: config.openaiApiKey
      });
      
      const response = await openai.chat.completions.create({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });
      return response.choices[0].message.content;
    } else {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.deepseekApiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
        }),
      });
      const data = await response.json();
      return data.choices[0].message.content;
    }
  } catch (error) {
    console.error(chalk.red('Error calling AI API:'), error);
    throw error;
  }
}

async function generateConfigFile(name, viewName) {
  return `import type { RouteRecordRaw } from 'vue-router'

export interface MicroFrontendConfig {
    name: string
    routes: RouteRecordRaw[]
    layout?: string
    menu?: string
    type?: string
    navItem?: {
        label: string
        order?: number
    }
}
const UI_FRAMEWORK = import.meta.env.VITE_UI_FRAMEWORK || 'bootstrap'

export const config: MicroFrontendConfig = {
    name: '${name}',
    layout: 'WebsiteLayout',
    type: 'website',
    navItem: {
        label: '${name}',
        order: 0
    },
    routes: [
        {
            path: '/${viewName.toLowerCase()}',
            name: '${viewName.toLowerCase()}',
            component: UI_FRAMEWORK === 'bootstrap'
                ? /* @vite-ignore */ () => import('./views/${viewName}Bootstrap.vue')
                : /* @vite-ignore */ () => import('./views/${viewName}Fomantic.vue'),
            meta: {
                title: '${name}'
            }
        }
    ]
}`;
}

async function generateVueComponent(description, framework) {
  const prompt = `
Generate a Vue 3 component using the Composition API (setup) for a ${framework} UI website page with the following description:
${description}

Requirements:
1. Use ${framework} UI classes and components
2. Follow Vue 3 best practices with TypeScript
3. Include proper styling with scoped CSS
4. Ensure responsive design
5. Use semantic HTML structure
6. Include proper TypeScript type definitions
7. Follow the component structure:
   - Template section
   - Script section with defineComponent and setup
   - Scoped style section

The component should be a complete, working Vue 3 component that can be used directly in a website.
Return only the component code without any explanation.
`;

  try {
    return await callAI(prompt);
  } catch (error) {
    console.error(chalk.red('Error generating Vue component:'), error);
    throw error;
  }
}

export async function generateWebsiteMicrofrontend() {
  console.log(chalk.cyan('\n🌐 Generating Website Microfrontend\n'));

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

    // Verify project structure
    const spinner = ora('Verifying project structure...').start();
    try {
      await fs.access(frontendPath);
      spinner.succeed('Project structure verified');
    } catch (error) {
      spinner.fail('Invalid project structure');
      console.error(chalk.red('Error: Expected frontend/ directory in project root'));
      process.exit(1);
    }

    // Get microfrontend details
    const { name, viewName, description } = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Enter the microfrontend name (e.g., "About Us"):',
        validate: (input) => {
          if (input.trim() === '') return 'Name is required';
          return true;
        }
      },
      {
        type: 'input',
        name: 'viewName',
        message: 'Enter the view name (e.g., "About"):',
        validate: (input) => {
          if (input.trim() === '') return 'View name is required';
          if (!/^[A-Z][a-zA-Z0-9]*$/.test(input)) {
            return 'View name must start with a capital letter and contain only letters and numbers';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'description',
        message: 'Describe the page and its requirements:',
        validate: (input) => input.trim() !== '' || 'Description is required'
      }
    ]);

    // Create directory structure
    const baseDir = join(frontendPath, 'src/_frontends/website', viewName.toLowerCase());
    const viewsDir = join(baseDir, 'views');

    await fs.mkdir(viewsDir, { recursive: true });

    // Generate config file
    spinner.start('Generating configuration...');
    const configContent = await generateConfigFile(name, viewName);
    await fs.writeFile(join(baseDir, 'config.ts'), configContent);
    spinner.succeed('Configuration generated');

    // Generate Bootstrap view
    spinner.start('Generating Bootstrap view...');
    const bootstrapContent = await generateVueComponent(description, 'Bootstrap');
    await fs.writeFile(join(viewsDir, `${viewName}Bootstrap.vue`), bootstrapContent);
    spinner.succeed('Bootstrap view generated');

    // Generate Fomantic view
    spinner.start('Generating Fomantic view...');
    const fomanticContent = await generateVueComponent(description, 'Fomantic UI');
    await fs.writeFile(join(viewsDir, `${viewName}Fomantic.vue`), fomanticContent);
    spinner.succeed('Fomantic view generated');

    console.log(chalk.green('\n✨ Website microfrontend generated successfully!'));
    console.log(chalk.cyan('\nGenerated files:'));
    console.log(chalk.white(`├── frontend/src/_frontends/website/${viewName.toLowerCase()}/`));
    console.log(chalk.white(`    ├── config.ts`));
    console.log(chalk.white(`    └── views/`));
    console.log(chalk.white(`        ├── ${viewName}Bootstrap.vue`));
    console.log(chalk.white(`        └── ${viewName}Fomantic.vue`));

    console.log(chalk.cyan('\nNext steps:'));
    console.log('1. Review the generated views in:');
    console.log(chalk.white(`   frontend/src/_frontends/website/${viewName.toLowerCase()}/views/`));
    console.log('2. Add the microfrontend to your router configuration');
    console.log('3. Test the new page with both UI frameworks');

  } catch (error) {
    console.error(chalk.red('\n❌ Error generating website microfrontend:'), error.message);
    process.exit(1);
  }
}
