import type { Project } from '../language/generated/ast.js';
import chalk from 'chalk';
import { Command } from 'commander';
import { ProjectFlowSyntaxLanguageMetaData } from '../language/generated/module.js';
import { createProjectFlowSyntaxServices } from '../language/project-flow-syntax-module.js';
import { extractAstNode } from './cli-util.js';
import { NodeFileSystem } from 'langium/node';
import * as url from 'node:url';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import {extractEntities} from "../util/extractEntities.js";
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));

const packagePath = path.resolve(__dirname, '..', '..', 'package.json');
const packageContent = await fs.readFile(packagePath, 'utf-8');

export const generateAction = async (fileName: string, opts: GenerateOptions): Promise<void> => {
    const services = createProjectFlowSyntaxServices(NodeFileSystem).ProjectFlowSyntax;
    const model = await extractAstNode<Project>(fileName, services);
    const jsonAstString = services.serializer.JsonSerializer.serialize(model)
    console.log(chalk.green(`JSON AST generated successfully!`));
    console.log(jsonAstString);
};

export const snapshotAction = async (fileName: string, opts: GenerateOptions): Promise<void> => {
    const services = createProjectFlowSyntaxServices(NodeFileSystem).ProjectFlowSyntax;
    const model = await extractAstNode<Project>(fileName, services);
    const snapshot = extractEntities(model)
    console.log(chalk.green(`Project snapshot generated successfully!`));
    console.log(JSON.stringify(snapshot));
};

export type GenerateOptions = {
    destination?: string;
}

export default function(): void {
    const program = new Command();

    program.version(JSON.parse(packageContent).version);

    const fileExtensions = ProjectFlowSyntaxLanguageMetaData.fileExtensions.join(', ');
    program
        .command('generate')
        .argument('<file>', `source file (possible file extensions: ${fileExtensions})`)
        .description('generates an AST representation of the source file in JSON format and prints to console')
        .action(generateAction);
    program
        .command('snapshot')
        .argument('<file>', `source file (possible file extensions: ${fileExtensions})`)
        .description('parses the source file and generates a snapshot of the project and entities')
        .action(snapshotAction);

    program.parse(process.argv);
}
