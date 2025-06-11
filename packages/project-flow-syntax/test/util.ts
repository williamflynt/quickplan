import { LangiumDocument } from "langium";
import { isProject, Project } from "../src/language/generated/ast.js";
import * as fs from "fs";
import * as path from "path";

export type ValidityResult = {
    isValid: boolean;
    errors: string[];
}

export const documentIsValid = (document: LangiumDocument<Project>): ValidityResult => {
    const result: ValidityResult = {isValid: true, errors: [] }
    if (document.parseResult.parserErrors.length > 0) {
        result.isValid = false;
        result.errors = document.parseResult.parserErrors.map(error => error.message);
    }
    if (document.parseResult.value === undefined) {
        result.errors.push(`ParseResult is 'undefined'.`)
    }
    if (!isProject(document.parseResult.value)) {
        result.errors.push(`Root AST object is a ${document.parseResult.value['$type']}, expected a '${Project}'.`);
    }
    if (document.parseResult.value?.lines?.length === 0) {
        result.errors.push(`Project object has no lines.`);
    }
    for (const err of result.errors) {
        console.error(err);
    }
    return result
}

export const findPfsFiles = (dir: string): string[] => {
    return fs.readdirSync(dir)
        .filter(file => path.extname(file) === '.pfs')
        .map(file => path.resolve(dir, file));
}

/**
 * Add whitespace in various ways to the input, including spaces, tabs, and newlines.
 * @param input
 */
export const whitespaced = (input: string): string[] => {
    return [
        input,
        ` ${input}`,
        `${input} `,
        ` ${input} `,
        `\t${input}`,
        `${input}\t`,
        `\t${input}\t`,
        `\n${input}`,
        `${input}\n`,
        `\n${input}\n`,
        ` \t\n${input} \t\n`,
    ]
}
