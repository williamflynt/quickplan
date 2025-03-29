type WorkerResponse = {
    type: 'ready' | 'result' | 'error';
    data?: any;
    id?: number;
    error?: string;
};

// Global (to the worker) memoization.
let worker: Worker | null = null;
let nextId = 1;
const callbacks: Record<number, (result: any) => void> = {};

function getWorker(): Worker {
    if (!worker) {
        // Create worker from a separate file. See README.md for why.
        worker = new Worker(new URL('./wasmWorker.ts', import.meta.url), { type: 'module' });

        // Handle messages from the worker
        worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
            const data = e.data;

            if (data.type === 'result' && data.id && callbacks[data.id]) {
                callbacks[data.id](data.data);
                delete callbacks[data.id];
            } else if (data.type === 'error' && data.id && callbacks[data.id]) {
                console.error('WASM worker error:', data.error);
                callbacks[data.id]({ error: data.error });
                delete callbacks[data.id];
            }
        };

        // Initialize the worker.
        worker.postMessage({ type: 'init' });
    }
    return worker;
}

/**
 * Passes the array of tasks to the WASM "Calculate" function and returns the computed chart.
 * Runs in a separate worker to avoid conflicts with Monaco editor.
 */
export async function runCpm(tasks: any[]): Promise<any> {
    const id = nextId++;

    return new Promise<any>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            delete callbacks[id];
            reject(new Error('WASM calculation timed out'));
        }, 2_000); // 2 second timeout

        callbacks[id] = (result) => {
            clearTimeout(timeoutId);
            if (result && result.error) {
                reject(new Error(result.error));
            } else {
                try {
                    const chart = result.chart ? JSON.parse(result.chart) : result;
                    resolve(chart);
                } catch (err) {
                    reject(new Error(`Failed to parse WASM result: ${err}`));
                }
            }
        };

        getWorker().postMessage({
            type: 'calculate',
            tasks,
            id,
        });
    });
}