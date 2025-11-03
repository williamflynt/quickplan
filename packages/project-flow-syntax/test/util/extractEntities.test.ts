import {describe, expect, test} from "vitest";
import {findPfsFiles} from "../util.js";
import {extractEntities} from "../../src/util/extractEntities.js";
import {parseHelper} from "langium/test";
import {createProjectFlowSyntaxServices} from "../../src/language/project-flow-syntax-module.js";
import {EmptyFileSystem} from "langium";
import fs from "fs";

const samples = findPfsFiles('samples');
const services = createProjectFlowSyntaxServices(EmptyFileSystem)
const parse = parseHelper(services.ProjectFlowSyntax)

describe('extractEntities', async () => {
    for (const sample of samples) {
        const nameComponents = sample.split('/');
        const name = nameComponents[nameComponents.length - 1];
        test(`does extract from ${name}`, async () => {
            const content = fs.readFileSync(sample).toString()
            const ast = await parse(content);
            const project = extractEntities(ast.parseResult.value);
            expect(Object.keys(project.tasks).length).toBeGreaterThan(0);
            expect(Object.keys(project.milestones).length).toBeGreaterThan(0);
            expect(Object.keys(project.resources).length).toBeGreaterThan(0);
            expect(Object.keys(project.clusters).length).toBeGreaterThan(0);
        })
    }

    test('MyTask(a: 1, b: "2", c: 3.0)', async () => {
        const ast = await parse('MyTask(a: 1, b: "2", c: 3.0)');
        const project = extractEntities(ast.parseResult.value);
        expect(Object.keys(project.tasks).length).toBe(1);
        const task = project.tasks['MyTask'];
        expect(task.name).toBe('MyTask');
        expect(Object.keys(task.attributes).length).toBe(3);
        expect(task.attributes['a']).toBe(1);
        expect(task.attributes['b']).toBe('"2"');
        expect(task.attributes['c']).toBe(3.0);
    })

    test('MyTask(a: 1, a: ~)', async () => {
        const ast = await parse('MyTask(a: 1, a: ~)');
        const project = extractEntities(ast.parseResult.value);
        expect(Object.keys(project.tasks).length).toBe(1);
        const task = project.tasks['MyTask'];
        expect(task.name).toBe('MyTask');
        expect(Object.keys(task.attributes).length).toBe(0);
    })

    test('MyTask multiline attribute negation', async () => {
        const ast = await parse('MyTask\nMyTask(a: 1)\nMyTask(a: ~)\nMyTask(a: 2)');
        const project = extractEntities(ast.parseResult.value);
        expect(Object.keys(project.tasks).length).toBe(1);
        const task = project.tasks['MyTask'];
        expect(task.name).toBe('MyTask');
        expect(Object.keys(task.attributes).length).toBe(1);
        expect(task.attributes['a']).toBe(2);
    })

    test('X > Y', async () => {
        const ast = await parse('X > Y');
        const project = extractEntities(ast.parseResult.value);
        expect(Object.keys(project.tasks).length).toBe(2);
        expect(project.tasks['X'].name).toBe('X');
        expect(project.tasks['Y'].name).toBe('Y');
        expect(project.dependencies.to(project.tasks['X']).size).toBe(0);
        expect(project.dependencies.from(project.tasks['X']).size).toBe(1);
        expect(project.dependencies.to(project.tasks['Y']).size).toBe(1);
        expect(project.dependencies.from(project.tasks['Y']).size).toBe(0);
        expect(project.dependencies.has(project.tasks['X'], project.tasks['Y'])).toBe(true);
    })

    test('X > %Y', async () => {
        const ast = await parse('X > %Y');
        const project = extractEntities(ast.parseResult.value);
        expect(Object.keys(project.tasks).length).toBe(1);
        expect(Object.keys(project.milestones).length).toBe(1);
        expect(project.tasks['X'].name).toBe('X');
        expect(project.milestones['Y'].name).toBe('Y');
        expect(project.dependencies.to(project.tasks['X']).size).toBe(0);
        expect(project.dependencies.from(project.tasks['X']).size).toBe(1);
        expect(project.dependencies.to(project.milestones['Y']).size).toBe(1);
        expect(project.dependencies.from(project.milestones['Y']).size).toBe(0);
        expect(project.dependencies.has(project.tasks['X'], project.milestones['Y'])).toBe(true);
    })

    test('X > Y > Z > A, B, C', async () => {
        const ast = await parse('X > Y > Z > A, B, C');
        const project = extractEntities(ast.parseResult.value);
        expect(Object.keys(project.tasks).length).toBe(6);
        expect(project.dependencies.to(project.tasks['X']).size).toBe(0);
        expect(project.dependencies.from(project.tasks['X']).size).toBe(1);
        expect(project.dependencies.to(project.tasks['Y']).size).toBe(1);
        expect(project.dependencies.from(project.tasks['Y']).size).toBe(1);
        expect(project.dependencies.to(project.tasks['Z']).size).toBe(1);
        expect(project.dependencies.from(project.tasks['Z']).size).toBe(3);
        expect(project.dependencies.has(project.tasks['Z'], project.tasks['A'])).toBe(true);
        expect(project.dependencies.has(project.tasks['Z'], project.tasks['B'])).toBe(true);
        expect(project.dependencies.has(project.tasks['Z'], project.tasks['C'])).toBe(true);
    })

    test('X > Y > Z\\nX ~> Y', async () => {
        const ast = await parse('X > Y > Z\nX ~> Y');
        const project = extractEntities(ast.parseResult.value);
        expect(Object.keys(project.tasks).length).toBe(3);
        expect(project.dependencies.to(project.tasks['X']).size).toBe(0);
        expect(project.dependencies.from(project.tasks['X']).size).toBe(0);
        expect(project.dependencies.to(project.tasks['Y']).size).toBe(0);
        expect(project.dependencies.from(project.tasks['Y']).size).toBe(1);
        expect(project.dependencies.to(project.tasks['Z']).size).toBe(1);
        expect(project.dependencies.from(project.tasks['Z']).size).toBe(0);
        expect(project.dependencies.has(project.tasks['Y'], project.tasks['Z'])).toBe(true);
    })

    test('$X > Y, MyTask', async () => {
        const ast = await parse('$X > Y, MyTask');
        const project = extractEntities(ast.parseResult.value);
        expect(Object.keys(project.tasks).length).toBe(2);
        expect(project.resources['X'].name).toBe('X');
        expect(project.tasks['X']).toBeUndefined();
        expect(project.tasks['Y'].name).toBe('Y');
        // Validate no deps.
        expect(project.dependencies.to(project.tasks['X']).size).toBe(0);
        expect(project.dependencies.from(project.tasks['X']).size).toBe(0);
        expect(project.dependencies.to(project.tasks['Y']).size).toBe(0);
        expect(project.dependencies.from(project.tasks['Y']).size).toBe(0);
        expect(project.dependencies.has(project.tasks['X'], project.tasks['Y'])).toBe(false);
        // Test for assignment.
        expect(project.assignments.from(project.resources['X']).size).toBe(2);
        expect(project.assignments.has(project.resources['X'], project.tasks['Y'])).toBe(true);
        expect(project.assignments.has(project.resources['X'], project.tasks['MyTask'])).toBe(true);
    })

    test('X ! 10', async () => {
        const ast = await parse('X ! 10');
        const project = extractEntities(ast.parseResult.value);
        expect(Object.keys(project.tasks).length).toBe(10);
        expect(project.tasks['X']).toBeUndefined();
        for (const k of Object.keys(project.tasks)) {
            expect(project.tasks[k].name).toBe(k);
            expect(project.tasks[k].name.startsWith('X-')).toBe(true);
        }
    })

    test('A, B, C / X', async () => {
        const ast = await parse('A, B, C / X');
        const project = extractEntities(ast.parseResult.value);
        expect(Object.keys(project.tasks).length).toBe(1);
        expect(project.tasks['X']).toBeDefined();
        expect(project.tasks['X'].name).toBe('X');
    })

    test('Cluster serialization', async () => {
        const ast = await parse('task1\ntask2\ntask3\n@my_cluster: task1, task2, task3');
        const project = extractEntities(ast.parseResult.value);
        console.log('Clusters:', JSON.stringify(project.clusters, null, 2));
        expect(Object.keys(project.clusters).length).toBe(1);
        expect(project.clusters['my_cluster']).toBeDefined();
        expect(project.clusters['my_cluster'].name).toBe('my_cluster');
        const clusterJson = JSON.parse(JSON.stringify(project.clusters['my_cluster']));
        console.log('Cluster JSON:', clusterJson);
    })
})
