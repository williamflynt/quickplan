import {describe, expect, test} from "vitest";
import {findPfsFiles} from "../util.js";
import {syncParse} from "../../src/cli/syncParse.js";
import fs from "fs";

const samples = findPfsFiles('samples');

describe('Sync Parser', async () => {
    for (const sample of samples) {
        const nameComponents = sample.split('/');
        const name = nameComponents[nameComponents.length - 1];
        test(`does parse ${name}`, async () => {
            const content = fs.readFileSync(sample).toString()
            const generated = syncParse(content);
            expect(generated.length).toBeGreaterThan(2); // "{}"
            const asMap = JSON.parse(generated);
            // Strip the comment lines and empty lines from the document before counting newlines.
            const documentNewLines = content.split('\n').filter(line => !line.startsWith('#') && line.trim().length > 0).length;
            const astLines = asMap.lines.length;
            expect(astLines).toStrictEqual(documentNewLines);
            console.info(`[OK] ${sample}`)
        })
    }
})