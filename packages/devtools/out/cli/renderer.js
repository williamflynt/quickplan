import chalk from 'chalk';
export function attachRenderer(app, options) {
    const isTTY = process.stdout.isTTY ?? false;
    app.on('command:end', (event) => {
        if (!event.result.ok) {
            if (isTTY) {
                process.stderr.write(chalk.red(`Error: ${event.result.error}\n`));
            }
            else {
                process.stderr.write(JSON.stringify({ error: event.result.error, details: event.result.details }) + '\n');
            }
            return;
        }
        if (isTTY) {
            renderTTY(event.result.data);
        }
        else {
            process.stdout.write(JSON.stringify(event.result.data) + '\n');
        }
    });
    app.on('command:error', (event) => {
        if (isTTY) {
            process.stderr.write(chalk.red(`Error: ${event.error}\n`));
        }
        else {
            process.stderr.write(JSON.stringify({ error: event.error }) + '\n');
        }
    });
    app.on('command:plan', (event) => {
        if (isTTY) {
            process.stdout.write(chalk.bold.cyan('Plan:\n'));
            for (const step of event.plan.steps) {
                const deps = step.dependsOn.length > 0
                    ? chalk.gray(` (after: ${step.dependsOn.join(', ')})`)
                    : '';
                process.stdout.write(`  ${chalk.white(step.id)}: ${step.description}${deps}\n`);
            }
        }
        else {
            process.stdout.write(JSON.stringify(event.plan) + '\n');
        }
    });
    app.on('log', (event) => {
        if (options.quiet)
            return;
        if (event.level === 'debug' && !options.verbose)
            return;
        if (isTTY) {
            const color = {
                debug: chalk.gray,
                info: chalk.blue,
                warn: chalk.yellow,
                error: chalk.red,
            }[event.level];
            process.stderr.write(color(`[${event.level}] ${event.message}\n`));
        }
        else if (options.verbose) {
            process.stderr.write(JSON.stringify({ level: event.level, message: event.message, data: event.data }) + '\n');
        }
    });
    app.on('progress', (event) => {
        if (options.quiet || !isTTY)
            return;
        const counter = event.current != null && event.total != null
            ? ` [${event.current}/${event.total}]`
            : '';
        process.stderr.write(chalk.cyan(`${event.message}${counter}\n`));
    });
    // Process output events — source-prefixed log lines
    const sourceColors = {
        vite: chalk.green,
        chromium: chalk.magenta,
    };
    const colorForSource = (source) => sourceColors[source] ?? chalk.white;
    app.on('process:stdout', (event) => {
        if (options.quiet)
            return;
        if (isTTY) {
            const color = colorForSource(event.source);
            process.stdout.write(`${color(`[${event.source}]`)} ${event.line}\n`);
        }
        else {
            process.stderr.write(JSON.stringify({ source: event.source, stream: 'stdout', line: event.line }) + '\n');
        }
    });
    app.on('process:stderr', (event) => {
        if (options.quiet)
            return;
        if (isTTY) {
            const color = colorForSource(event.source);
            process.stderr.write(`${color(`[${event.source}]`)} ${event.line}\n`);
        }
        else {
            process.stderr.write(JSON.stringify({ source: event.source, stream: 'stderr', line: event.line }) + '\n');
        }
    });
    app.on('process:exit', (event) => {
        if (options.quiet)
            return;
        const msg = `Process "${event.source}" exited (code: ${event.exitCode}, signal: ${event.signal})`;
        if (isTTY) {
            process.stderr.write(chalk.yellow(`${msg}\n`));
        }
        else {
            process.stderr.write(JSON.stringify({ source: event.source, exitCode: event.exitCode, signal: event.signal }) + '\n');
        }
    });
}
function renderTTY(data) {
    if (Array.isArray(data)) {
        if (data.length === 0)
            return;
        // String arrays: one per line
        if (typeof data[0] === 'string') {
            for (const item of data) {
                process.stdout.write(item + '\n');
            }
            return;
        }
    }
    // Fallback: pretty-print JSON
    process.stdout.write(JSON.stringify(data, null, 2) + '\n');
}
//# sourceMappingURL=renderer.js.map