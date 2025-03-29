# `wasm/`

We initialize the Go-based WASM in a web worker to avoid clobbering Monaco/VS Code.

Specifically, loading the Go-required `wasm_exec.js` causes errors in the code editor.

Not diagnosed, just worked around.
