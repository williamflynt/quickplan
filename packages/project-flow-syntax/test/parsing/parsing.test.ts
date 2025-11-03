import {beforeAll, describe, expect, test} from "vitest";
import {EmptyFileSystem, type LangiumDocument} from "langium";
import {parseHelper} from "langium/test";
import {createProjectFlowSyntaxServices} from "../../src/language/project-flow-syntax-module.js";
import {Project} from "../../src/language/generated/ast.js";
import {documentIsValid, findPfsFiles, whitespaced} from "../util.js";
import * as fs from "fs";
import {astNodeToProjectFlowSyntax} from "../../src/cli/generator/generateProjectFlowSyntax.js";

const samples = findPfsFiles('samples');
let services: ReturnType<typeof createProjectFlowSyntaxServices>;
let parse: ReturnType<typeof parseHelper<Project>>;
let document: LangiumDocument<Project> | undefined;

beforeAll(async () => {
    services = createProjectFlowSyntaxServices(EmptyFileSystem);
    parse = parseHelper<Project>(services.ProjectFlowSyntax);
});

describe('General sample parsing', () => {
    for (const sample of samples) {
        const nameComponents = sample.split('/')
        const name = nameComponents[nameComponents.length - 1]
        test(`${name}`, async () => {
            const content = fs.readFileSync(sample).toString()
            document = await parse(content);
            const validity = documentIsValid(document);
            expect(validity.isValid).toStrictEqual(true);
            expect(validity.errors.length).toStrictEqual(0);
            const generated = astNodeToProjectFlowSyntax(document.parseResult.value);
            const genDoc = await parse(generated);
            const genVal = documentIsValid(genDoc);
            expect(genVal.isValid).toStrictEqual(true);
            expect(genVal.errors.length).toStrictEqual(0);
        })
    }
});

/* Define a bunch of test cases and test them the same way. */
type TestCase = {
    name: string;
    input: string;
    idealizedSyntax: string;
    expectedAstValues: Record<string, any>;
    shouldFail?: boolean;
}

/**
 * Test a single test case.
 * @param t
 */
const doTest = (t: TestCase) => {
    return async () => {
        console.info(JSON.stringify(t.input));
        document = await parse(t.input);
        const validity = documentIsValid(document);
        if (t.shouldFail) {
            expect(validity.isValid).toStrictEqual(false);
            return;
        }
        expect(validity.isValid).toStrictEqual(true);
        expect(validity.errors.length).toStrictEqual(0);
        // We don't test the other direction (keys in parseResult) because the actual AST
        // has many hidden fields that we don't want to test.
        for (const key in t.expectedAstValues) {
            // @ts-ignore
            expect(document.parseResult.value.lines[0][key]).toStrictEqual(t.expectedAstValues[key]);
        }
        // Comparing generated syntax is much easier than comparing ASTs, but not as robust... :-(
        const generated = astNodeToProjectFlowSyntax(document.parseResult.value);
        expect(generated).toStrictEqual(t.idealizedSyntax);
    }
}

describe('Task Rule', () => {
    const tests: TestCase[] = [
        {
            name: 'simple ID',
            input: 'X',
            idealizedSyntax: 'X',
            expectedAstValues: {$type: 'Task', name: 'X', attributes: []}
        },
        {
            name: 'ID with attributes',
            input: 'X(a: attr, b: 123123, c: 0123, d: "d")',
            idealizedSyntax: 'X(a: attr, b: 123123, c: 0123, d: "d")',
            expectedAstValues: {$type: 'Task', name: 'X'}
        },
    ]
    for (const t of tests) {
        const permutedInput = whitespaced(t.input)
        for (const [idx, input] of permutedInput.entries()) {
            test(`${t.name}-${idx}`, doTest({...t, input}));
        }
    }
});

describe('Resource Rule', () => {
    const tests: TestCase[] = [
        {
            name: 'simple resource',
            input: '$Resource',
            idealizedSyntax: '$Resource',
            expectedAstValues: {$type: 'Resource', name: 'Resource', attributes: []}
        },
        {
            name: 'resource with attributes',
            input: '$Developer(role: "Backend", level: 5)',
            idealizedSyntax: '$Developer(role: "Backend", level: 5)',
            expectedAstValues: {$type: 'Resource', name: 'Developer'}
        },
    ]
    for (const t of tests) {
        const permutedInput = whitespaced(t.input)
        for (const [idx, input] of permutedInput.entries()) {
            test(`${t.name}-${idx}`, doTest({...t, input}));
        }
    }
});

describe('Milestone Rule', () => {
    const tests: TestCase[] = [
        {
            name: 'simple milestone',
            input: '%Milestone',
            idealizedSyntax: '%Milestone',
            expectedAstValues: {$type: 'Milestone', name: 'Milestone', attributes: []}
        },
        {
            name: 'milestone with attributes',
            input: '%ProjectComplete(date: "2023-12-01", priority: high)',
            idealizedSyntax: '%ProjectComplete(date: "2023-12-01", priority: high)',
            expectedAstValues: {$type: 'Milestone', name: 'ProjectComplete'}
        },
    ]
    for (const t of tests) {
        const permutedInput = whitespaced(t.input)
        for (const [idx, input] of permutedInput.entries()) {
            test(`${t.name}-${idx}`, doTest({...t, input}));
        }
    }
});

describe('Cluster Rule', () => {
    const tests: TestCase[] = [
        {
            name: 'empty cluster',
            input: '@Phase1',
            idealizedSyntax: '@Phase1',
            expectedAstValues: {$type: 'Cluster', name: 'Phase1', items: []}
        },
        {
            name: 'cluster with items',
            input: '@Backend: Setup, Implementation, Testing',
            idealizedSyntax: '@Backend: Setup, Implementation, Testing',
            expectedAstValues: {$type: 'Cluster', name: 'Backend'}
        },
    ]
    for (const t of tests) {
        const permutedInput = whitespaced(t.input)
        for (const [idx, input] of permutedInput.entries()) {
            test(`${t.name}-${idx}`, doTest({...t, input}));
        }
    }
});

describe('Attribute Rule', () => {
    const tests: TestCase[] = [
        {
            name: 'attribute with string value',
            input: 'Task(name: "Test Task")',
            idealizedSyntax: 'Task(name: "Test Task")',
            expectedAstValues: {$type: 'Task', name: 'Task'}
        },
        {
            name: 'attribute with numeric value',
            input: 'Task(duration: 5)',
            idealizedSyntax: 'Task(duration: 5)',
            expectedAstValues: {$type: 'Task', name: 'Task'}
        },
        {
            name: 'attribute with identifier value',
            input: 'Task(priority: high)',
            idealizedSyntax: 'Task(priority: high)',
            expectedAstValues: {$type: 'Task', name: 'Task'}
        },
        {
            name: 'multiple attributes',
            input: 'Task(priority: high, duration: 3, owner: "John")',
            idealizedSyntax: 'Task(priority: high, duration: 3, owner: "John")',
            expectedAstValues: {$type: 'Task', name: 'Task'}
        },
    ]
    for (const t of tests) {
        const permutedInput = whitespaced(t.input)
        for (const [idx, input] of permutedInput.entries()) {
            test(`${t.name}-${idx}`, doTest({...t, input}));
        }
    }
});

describe('DependencyChain Rule', () => {
    const tests: TestCase[] = [
        {
            name: 'simple dependency chain',
            input: 'A > B > C',
            idealizedSyntax: 'A > B > C',
            expectedAstValues: {$type: 'DependencyChain'}
        },
        {
            name: 'dependency chain with multiple tasks',
            input: 'A, B > C, D > E',
            idealizedSyntax: 'A, B > C, D > E',
            expectedAstValues: {$type: 'DependencyChain'}
        },
        {
            name: 'dependency chain with removal',
            input: 'A > B ~> C',
            idealizedSyntax: 'A > B ~> C',
            expectedAstValues: {$type: 'DependencyChain'}
        },
    ]
    for (const t of tests) {
        const permutedInput = whitespaced(t.input)
        for (const [idx, input] of permutedInput.entries()) {
            test(`${t.name}-${idx}`, doTest({...t, input}));
        }
    }
});

describe('DependencySegment Rule', () => {
    // This is tested indirectly through DependencyChain
    // But we can test it explicitly for thoroughness
    const tests: TestCase[] = [
        {
            name: 'simple dependency segment',
            input: 'A > B',
            idealizedSyntax: 'A > B',
            expectedAstValues: {$type: 'DependencyChain'}
        },
        {
            name: 'dependency segment with removal',
            input: 'A ~> B',
            idealizedSyntax: 'A ~> B',
            expectedAstValues: {$type: 'DependencyChain'}
        },
    ]
    for (const t of tests) {
        const permutedInput = whitespaced(t.input)
        for (const [idx, input] of permutedInput.entries()) {
            test(`${t.name}-${idx}`, doTest({...t, input}));
        }
    }
});

describe('Assignment Rule', () => {
    const tests: TestCase[] = [
        {
            name: 'resource to task assignment',
            input: '$Developer > Task',
            idealizedSyntax: '$Developer > Task',
            expectedAstValues: {$type: 'Assignment'}
        },
        {
            name: 'task to resource assignment',
            input: 'Task>$Developer',
            idealizedSyntax: '$Developer > Task',
            expectedAstValues: {$type: 'Assignment'}
        },
        {
            name: 'multiple resources to tasks',
            input: '$Dev1, $Dev2 > Task1, Task2',
            idealizedSyntax: '$Dev1, $Dev2 > Task1, Task2',
            expectedAstValues: {$type: 'Assignment'}
        },
        {
            name: 'resource removal assignment',
            input: '$Developer ~> Task',
            idealizedSyntax: '$Developer ~> Task',
            expectedAstValues: {$type: 'Assignment', remove: true}
        },
    ]
    for (const t of tests) {
        const permutedInput = whitespaced(t.input)
        for (const [idx, input] of permutedInput.entries()) {
            test(`${t.name}-${idx}`, doTest({...t, input}));
        }
    }
});

describe('SplitTask Rule', () => {
    const tests: TestCase[] = [
        {
            name: 'fan in split task',
            input: '* > Task',
            idealizedSyntax: '* > Task',
            expectedAstValues: {$type: 'SplitTask', left: true}
        },
        {
            name: 'fan out split task',
            input: 'Task > *',
            idealizedSyntax: 'Task > *',
            expectedAstValues: {$type: 'SplitTask', left: false}
        },
    ]
    for (const t of tests) {
        const permutedInput = whitespaced(t.input)
        for (const [idx, input] of permutedInput.entries()) {
            test(`${t.name}-${idx}`, doTest({...t, input}));
        }
    }
});

describe('RemoveEntity Rule', () => {
    const tests: TestCase[] = [
        {
            name: 'remove task',
            input: '~ Task',
            idealizedSyntax: '~Task',
            expectedAstValues: {$type: 'RemoveEntity'}
        },
        {
            name: 'remove task after dependency',
            input: 'Task > Task2\n~Task',
            idealizedSyntax: 'Task > Task2\n~Task',
            expectedAstValues: {$type: 'RemoveEntity'}
        },
        {
            name: 'remove resource',
            input: '~ $Developer',
            idealizedSyntax: '~$Developer',
            expectedAstValues: {$type: 'RemoveEntity'}
        },
        {
            name: 'remove milestone',
            input: '~ %Milestone',
            idealizedSyntax: '~%Milestone',
            expectedAstValues: {$type: 'RemoveEntity'}
        },
        {
            name: 'remove cluster',
            input: '~ @Cluster',
            idealizedSyntax: '~@Cluster',
            expectedAstValues: {$type: 'RemoveEntity'}
        },
    ]
    for (const t of tests) {
        const permutedInput = whitespaced(t.input)
        for (const [idx, input] of permutedInput.entries()) {
            test(`${t.name}-${idx}`, doTest({...t, input}));
        }
    }
});

describe('ExplodeTask Rule', () => {
    const tests: TestCase[] = [
        {
            name: 'explode task to count',
            input: 'Task ! 5',
            idealizedSyntax: 'Task ! 5',
            expectedAstValues: {$type: 'ExplodeTask', count: 5}
        },
        {
            name: 'explode task to subtasks',
            input: 'Task ! SubtaskA, SubtaskB, SubtaskC',
            idealizedSyntax: 'Task ! SubtaskA, SubtaskB, SubtaskC',
            expectedAstValues: {$type: 'ExplodeTask', count: undefined}
        },
    ]
    for (const t of tests) {
        const permutedInput = whitespaced(t.input)
        for (const [idx, input] of permutedInput.entries()) {
            test(`${t.name}-${idx}`, doTest({...t, input}));
        }
    }
});

describe('ImplodeTask Rule', () => {
    const tests: TestCase[] = [
        {
            name: 'implode tasks to parent',
            input: 'SubtaskA, SubtaskB, SubtaskC / ParentTask',
            idealizedSyntax: 'SubtaskA, SubtaskB, SubtaskC / ParentTask',
            expectedAstValues: {$type: 'ImplodeTask'}
        },
        {
            name: 'implode single task',
            input: 'Subtask / ParentTask',
            idealizedSyntax: 'Subtask / ParentTask',
            expectedAstValues: {$type: 'ImplodeTask'},
            shouldFail: true,
        },
    ]
    for (const t of tests) {
        const permutedInput = whitespaced(t.input)
        for (const [idx, input] of permutedInput.entries()) {
            test(`${t.name}-${idx}`, doTest({...t, input}));
        }
    }
});