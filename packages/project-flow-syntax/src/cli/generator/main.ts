import {Project} from '../../language/generated/ast.js';
import {expandToNode, joinToNode, toString} from 'langium/generate';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {extractDestinationAndName} from '../cli-util.js';

export function generateJavaScript(project: Project, filePath: string, destination: string | undefined): string {
    const data = extractDestinationAndName(filePath, destination);
    const generatedFilePath = `${path.join(data.destination, data.name)}.js`;

    const fileNode = expandToNode`
        "use strict";

        ${joinToNode(project.lines, line => `console.log('Hello, ${line.$type}!');`, {appendNewLineIfNotEmpty: true})}
    `.appendNewLineIfNotEmpty();

    if (!fs.existsSync(data.destination)) {
        fs.mkdirSync(data.destination, {recursive: true});
    }
    fs.writeFileSync(generatedFilePath, toString(fileNode));
    return generatedFilePath;
}

