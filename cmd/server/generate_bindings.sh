#!/bin/sh

cd ../../internal/grammar || exit 1

echo "Copying grammar.js file..."
cp ../../submodules/ProjectFlowSyntax/grammar/grammar.js ../../internal/grammar/grammar.js

echo "Generating tree-sitter bindings..."
tree-sitter generate

echo "Building tree-sitter WASM..."
tree-sitter build --wasm

echo "Bindings compilation completed."
