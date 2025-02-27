import OpenAI from 'openai';
import readline from 'readline';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const AI_PROVIDER = process.env.AI_PROVIDER || 'openai'; // 'openai' or 'deepseek'

const openai = new OpenAI({
    apiKey: OPENAI_API_KEY
});

const askQuestion = (query) => {
    return new Promise((resolve) => {
        rl.question(query, (answer) => {
            resolve(answer);
        });
    });
};

const callAI = async (prompt, model = 'gpt-3.5-turbo') => {
    try {
        if (AI_PROVIDER === 'openai') {
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
                    'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
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
        console.error('Error calling AI API:', error);
        throw error;
    }
};

const generateModulesList = async (systemDescription) => {
    const prompt = `
    As a system architect, analyze the following system description and provide a list of necessary database tables/modules.
    Try to imagine the system and its requirements and generate a list of tables/modules that are needed to implement the system, include tables that i not mentioned in the description but are necessary for the system to work properly.
    Return only the list of tables in a JSON array format with each table name in English and in singular form.
    System description: ${systemDescription}
    
    Example response format:
    ["user", "product", "category"]
    `;

    const response = await callAI(prompt);
    try {
        return JSON.parse(response);
    } catch (error) {
        console.error('Error parsing AI response:', response);
        throw new Error('Invalid AI response format');
    }
};

const generateModuleRunner = async (moduleName, systemDescription) => {
    const prompt = `
    Generate a module runner JSON configuration for a "${moduleName}" module based on this system description:
    ${systemDescription}

    Follow this exact structure but with appropriate fields for ${moduleName}:
    {
        "version": "0.0.0",
        "name": "module_name",
        "namePlural": "module_names",
        "NamePlural": "ModuleNames",
        "Name": "ModuleName",
        "path": "module_path",
        "schema": {
            // Define appropriate fields with types: string, number, boolean, enum, relationship:<entity>:type
        },
        "ui": {
            // For each schema field, define UI properties:
            // type (text, number, textarea, picture, relationship-single, relationship-multiple, enum, boolean)
            // label, placeholder, required, api-ref (for relationships), options (for enums)
        }
    }

    Rules:
    1. Use English names for all fields
    2. Include common fields like id, createdAt, updatedAt
    3. Make the configuration complete and valid JSON
    4. Use appropriate field types and UI components
    5. Ensure all relationships are properly defined


    Example response:


    {
    "version": "0.0.0",
    "name": "product",
    "namePlural": "products",
    "NamePlural": "Products",
    "Name": "Product",
    "path": "product",
    "schema": {
        "name": "string",
        "price": "number",
        "description": "string",
        "image": "string",
        "category": "relationship:category:array",
        "stock": "number",
        "rating": "number",
        "numReviews": "number",
        "countInStock": "number",
        "brand": "relationship:brand:single",
        "type": "enum",
        "active": "boolean",
        "createdAt": "string",
        "updatedAt": "string"
    },
    "ui": {
        "name": {
            "type": "text",
            "label": "Name",
            "placeholder": "Enter name",
            "required": true
        },
        "price": {
            "type": "number",
            "label": "Price",
            "placeholder": "Enter price",
            "required": true
        },
        "description": {
            "type": "textarea",
            "label": "Description",
            "placeholder": "Enter description",
            "required": true
        },
        "image": {
            "type": "picture",
            "label": "Image",
            "placeholder": "Enter image",
            "required": true
        },
        "category": {
            "type": "relationship-multiple",
            "label": "Categories",
            "placeholder": "Enter category",
            "api-ref": "category",
            "required": false
        },
        "stock": {
            "type": "number",
            "label": "Stock",
            "placeholder": "Enter stock",
            "required": true
        },
        "rating": {
            "type": "number",
            "label": "Rating",
            "placeholder": "Enter rating",
            "required": true
        },
        "numReviews": {
            "type": "number",
            "label": "NumReviews",
            "placeholder": "Enter numReviews",
            "required": true
        },
        "countInStock": {
            "type": "number",
            "label": "CountInStock",
            "placeholder": "Enter countInStock",
            "required": true
        },
        "brand": {
            "type": "relationship-single",
            "label": "Brand",
            "placeholder": "Enter brand",
            "api-ref": "brand",
            "required": false
        },
        "createdAt": {
            "type": "text",
            "label": "CreatedAt",
            "placeholder": "Enter createdAt",
            "required": true
        },
        "updatedAt": {
            "type": "text",
            "label": "UpdatedAt",
            "placeholder": "Enter updatedAt",
            "required": true
        },
        "type": {
            "type": "enum",
            "label": "Type",
            "placeholder": "Select type",
            "options": [
                "type1",
                "type2",
                "type3"
            ],
            "required": false
        },
        "active": {
            "type": "boolean",
            "label": "Active",
            "required": true
        }
    }
}

    `;

    const response = await callAI(prompt);
    try {
        const config = JSON.parse(response);
        return config;
    } catch (error) {
        console.error('Error parsing AI response:', response);
        throw new Error('Invalid module runner configuration');
    }
};

const saveModuleRunner = (config) => {
    const fileName = `${config.name}.runner.json`;
    const filePath = path.join(process.cwd(), 'generated_runners', fileName);

    if (!fs.existsSync('generated_runners')) {
        fs.mkdirSync('generated_runners');
    }

    fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
    console.log(`Generated runner file: ${fileName}`);
};

const main = async () => {
    try {
        console.log('AI-powered Module Generator');
        console.log('==========================');

        // Get system description
        const systemDescription = await askQuestion(
            'Please describe your system and its requirements (e.g., library system with books, members, loans...):\n'
        );

        // Generate modules list
        console.log('\nAnalyzing system description...');
        const modules = await generateModulesList(systemDescription);
        console.log('\nIdentified modules:', modules);

        // Generate runner for each module
        console.log('\nGenerating module runners...');
        for (const moduleName of modules) {
            console.log(`\nProcessing ${moduleName} module...`);
            const config = await generateModuleRunner(moduleName, systemDescription);
            saveModuleRunner(config);
        }

        console.log('\nModule generation completed!');
        rl.close();
    } catch (error) {
        console.error('Error:', error);
        rl.close();
    }
};

main();
