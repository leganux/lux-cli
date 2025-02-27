import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { getConfig, updateConfig } from '../utils/config.js';

export async function configure() {
  console.log(chalk.cyan('\n🔧 Configuring Lux CLI Settings\n'));

  try {
    const currentConfig = await getConfig();
    
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'aiProvider',
        message: 'Which AI provider would you like to use?',
        choices: [
          { name: 'OpenAI (default)', value: 'openai' },
          { name: 'Deepseek', value: 'deepseek' }
        ],
        default: currentConfig.aiProvider
      },
      {
        type: 'password',
        name: 'openaiApiKey',
        message: 'Enter your OpenAI API key:',
        when: (answers) => answers.aiProvider === 'openai',
        default: currentConfig.openaiApiKey,
        validate: (input) => {
          if (input.trim() === '') {
            return 'API key cannot be empty';
          }
          if (!input.startsWith('sk-')) {
            return 'Invalid OpenAI API key format. It should start with "sk-"';
          }
          return true;
        }
      },
      {
        type: 'password',
        name: 'deepseekApiKey',
        message: 'Enter your Deepseek API key:',
        when: (answers) => answers.aiProvider === 'deepseek',
        default: currentConfig.deepseekApiKey,
        validate: (input) => {
          if (input.trim() === '') {
            return 'API key cannot be empty';
          }
          return true;
        }
      }
    ]);

    const spinner = ora('Saving configuration...').start();

    const newConfig = {
      ...currentConfig,
      aiProvider: answers.aiProvider,
      openaiApiKey: answers.openaiApiKey || currentConfig.openaiApiKey,
      deepseekApiKey: answers.deepseekApiKey || currentConfig.deepseekApiKey
    };

    await updateConfig(newConfig);

    spinner.succeed(chalk.green('Configuration saved successfully! ✨'));
    
    console.log('\nCurrent configuration:');
    console.log(chalk.cyan('AI Provider:'), answers.aiProvider);
    console.log(chalk.cyan('API Key:'), '********' + (answers[answers.aiProvider + 'ApiKey'] || currentConfig[answers.aiProvider + 'ApiKey']).slice(-4));
    
  } catch (error) {
    console.error(chalk.red('\n❌ Error configuring CLI:'), error.message);
    process.exit(1);
  }
}
