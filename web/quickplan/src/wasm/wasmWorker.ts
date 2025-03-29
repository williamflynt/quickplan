// This imports the Go WASM runtime, which initializes the Go constructor in global scope.
import '../assets/wasm_exec.js';

// Export Go class from global scope for ease of use here.
export const Go = (globalThis as any).Go;

// Types for worker messages.
type InitMessage = { type: 'init' };
type CalculateMessage = { type: 'calculate'; tasks: any[]; id: number };
type WorkerMessage = InitMessage | CalculateMessage;

type ReadyMessage = { type: 'ready' };
type ResultMessage = { type: 'result'; data: any; id: number };
type WorkerResponse = ReadyMessage | ResultMessage;

let wasmReady = false;

async function initWasm(): Promise<void> {
    if (wasmReady) return;

    try {
        const go = new Go();
        const response = await fetch('../assets/main.wasm');
        const result = await WebAssembly.instantiateStreaming(response, go.importObject);
        go.run(result.instance);
        wasmReady = true;
        self.postMessage({ type: 'ready' } as ReadyMessage);
    } catch (error) {
        self.postMessage({
            type: 'error',
            error: error instanceof Error ? error.message : String(error)
        });
    }
}

// Handle messages from the main thread.
self.onmessage = async function(e: MessageEvent<WorkerMessage>): Promise<void> {
    const data = e.data;

    switch (data.type) {
        case 'init':
            await initWasm();
            break;

        case 'calculate':
            try {
                await initWasm();
                // Convert tasks to JSON strings as required by the WASM interface
                const tasksJson = data.tasks.map(t => JSON.stringify(t));
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                const result = self.Calculate(tasksJson); // Exists in WASM.

                // Send the result back to the main thread
                self.postMessage({
                    type: 'result',
                    data: result,
                    id: data.id
                } as ResultMessage);
            } catch (error) {
                self.postMessage({
                    type: 'error',
                    error: error instanceof Error ? error.message : String(error),
                    id: data.id
                });
            }
            break;
    }
};