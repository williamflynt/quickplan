import { beforeAll, beforeEach, describe, expect, test } from "vitest";
import { EmptyFileSystem, type LangiumDocument } from "langium";
import { parseHelper } from "langium/test";
import { createProjectFlowSyntaxServices } from "../../src/language/project-flow-syntax-module.js";
import { Project } from "../../src/language/generated/ast.js";
import { documentIsValid } from "../util.js";

let services: ReturnType<typeof createProjectFlowSyntaxServices>;
let parse:    ReturnType<typeof parseHelper<Project>>;
let document: LangiumDocument<Project> | undefined;

beforeAll(async () => {
    services = createProjectFlowSyntaxServices(EmptyFileSystem);
    const doParse = parseHelper<Project>(services.ProjectFlowSyntax);
    parse = (input: string) => doParse(input, { validation: true });
});

beforeEach(async () => {
    services.ProjectFlowSyntax.validation.ProjectFlowSyntaxValidator.resetDependencyNodes()
})

describe('Cycle detection', () => {
  
    test('ignores non-cycles in single line', async () => {
        document = await parse(`X > Y > Z`);
        const validity = documentIsValid(document);
        expect(validity.isValid).toBe(true);
        expect(document.diagnostics).toHaveLength(0);
    });

    test('ignores non-cycles in multiple lines', async () => {
        document = await parse(`X > Y > Z\nA>B>C\nX>B\nC>Z`);
        const validity = documentIsValid(document);
        expect(validity.isValid).toBe(true);
        expect(document.diagnostics).toHaveLength(0);
    });

    test('detects cycles in single line', async () => {
        document = await parse(`X > Y > X`);
        const validity = documentIsValid(document);
        expect(validity.isValid).toBe(true);
        expect(document.diagnostics).toHaveLength(1);
        // @ts-expect-error
        expect(document.diagnostics[0].message).toContain('Cycle detected in dependency chain');
    });

    test('detects self cycles', async () => {
        document = await parse(`X > X`);
        const validity = documentIsValid(document);
        expect(validity.isValid).toBe(true);
        expect(document.diagnostics).toHaveLength(1);
        // @ts-expect-error
        expect(document.diagnostics[0].message).toContain('Cycle detected in dependency chain');
    });

    test('detects cycles across multiple lines', async () => {
        document = await parse(`X > Y\nY > Z\nZ > X`);
        const validity = documentIsValid(document);
        expect(validity.isValid).toBe(true);
        expect(document.diagnostics).toHaveLength(1);
        // @ts-expect-error
        expect(document.diagnostics[0].message).toContain('Cycle detected in dependency chain');
    });

    test('properly accounts for removed deps in order', async () => {
        document = await parse(`X > Y\nY > Z\nX ~> Y\nZ > X`);
        const validity = documentIsValid(document);
        expect(validity.isValid).toBe(true);
        expect(document.diagnostics).toHaveLength(0);
    });

    test('detects cycles before dependency removal', async () => {
        // Test that our validator is "temporally accurate" - it works line by line in order.
        document = await parse(`X > Y\nY > Z\nZ > X\nX ~> Y`);
        const validity = documentIsValid(document);
        expect(validity.isValid).toBe(true);
        expect(document.diagnostics).toHaveLength(1);
        // @ts-expect-error
        expect(document.diagnostics[0].message).toContain('Cycle detected in dependency chain');
    });

});
