#!/usr/bin/env node

import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import {
    generateInterface,
    generateService,
    generateStore,
    generateConfig,
    generateBootstrapView,
    generateFomanticView
} from './generator/templates.js';

import {
    generateRelationshipService,
    generateRelationshipStore
} from './generator/relationship-templates.js';

async function checkFileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function readJsonFile(filePath) {
    try {
        console.log(`Reading JSON file from: ${filePath}`);
        const exists = await checkFileExists(filePath);
        if (!exists) {
            console.error(`File does not exist: ${filePath}`);
            process.exit(1);
        }
        const content = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(content);
    } catch (error) {
        console.error(`Error reading JSON file from ${filePath}:`, error);
        process.exit(1);
    }
}

async function createDirectory(dirPath) {
    try {
        console.log(`Creating directory: ${dirPath}`);
        await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
        console.error(`Error creating directory ${dirPath}:`, error);
        process.exit(1);
    }
}

async function writeFile(filePath, content) {
    try {
        console.log(`Writing file: ${filePath}`);
        const dirPath = dirname(filePath);
        await createDirectory(dirPath);
        await fs.writeFile(filePath, content);
        console.log(`Created ${filePath}`);
    } catch (error) {
        console.error(`Error writing file ${filePath}:`, error);
        process.exit(1);
    }
}

function findRelationships(schema) {
    const relationships = new Set();
    Object.entries(schema.schema).forEach(([_, type]) => {
        if (type.startsWith('relationship:')) {
            const [_, ref] = type.split(':');
            relationships.add(ref);
        }
    });
    return Array.from(relationships);
}

async function main() {
    try {
        let jsonPath;

        // Check if path is provided as command line argument
        if (process.argv.length > 2) {
            jsonPath = process.argv[2];
        } else {
            // If not, ask interactively
            const readline = (await import('readline')).createInterface({
                input: process.stdin,
                output: process.stdout
            });

            jsonPath = await new Promise((resolve) => {
                readline.question('Enter the path to your JSON schema file: ', (answer) => {
                    readline.close();
                    resolve(answer);
                });
            });
        }

        // Convert to absolute path if relative
        jsonPath = resolve(process.cwd(), jsonPath);

        // Read and parse the JSON schema
        const schema = await readJsonFile(jsonPath);
        console.log('Successfully parsed schema:', schema.name);

        // Create the microfrontend directory structure
        const baseDir = join(process.cwd(), 'src/_frontends/dashboard', schema.name);
        const interfacesDir = join(baseDir, 'interfaces');
        const servicesDir = join(baseDir, 'services');
        const storesDir = join(baseDir, 'stores');
        const viewsDir = join(baseDir, 'views');

        // Create all directories
        await Promise.all([
            createDirectory(interfacesDir),
            createDirectory(servicesDir),
            createDirectory(storesDir),
            createDirectory(viewsDir)
        ]);

        // Generate and write main files
        await Promise.all([
            writeFile(
                join(interfacesDir, `${schema.name}.interface.ts`),
                generateInterface(schema)
            ),
            writeFile(
                join(servicesDir, `${schema.name}.service.ts`),
                generateService(schema)
            ),
            writeFile(
                join(storesDir, `${schema.name}.store.ts`),
                generateStore(schema)
            ),
            writeFile(
                join(baseDir, 'config.ts'),
                generateConfig(schema)
            ),
            writeFile(
                join(viewsDir, `${schema.Name}Bootstrap.vue`),
                generateBootstrapView(schema)
            ),
            writeFile(
                join(viewsDir, `${schema.Name}Fomantic.vue`),
                generateFomanticView(schema)
            )
        ]);

        // Generate relationship services and stores
        const relationships = findRelationships(schema);
        for (const relationship of relationships) {
            console.log(`Generating files for relationship: ${relationship}`);
            
            await Promise.all([
                writeFile(
                    join(servicesDir, `${relationship}.service.ts`),
                    generateRelationshipService(relationship)
                ),
                writeFile(
                    join(storesDir, `${relationship}.store.ts`),
                    generateRelationshipStore(relationship)
                )
            ]);
        }

        console.log('\nMicrofrontend created successfully!');
        console.log(`\nLocation: ${baseDir}`);
        console.log('\nGenerated relationship services and stores for:', relationships);
        console.log('\nNext steps:');
        console.log('1. Add the microfrontend to your router configuration');
        console.log('2. Import and register any required components');
        console.log('3. Test the new microfrontend in your application');
    } catch (error) {
        console.error('Unexpected error:', error);
        process.exit(1);
    }
}

main().catch(console.error);
