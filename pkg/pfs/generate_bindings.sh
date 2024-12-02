#! /bin/zsh

# Check if tree-sitter is installed
if ! command -v tree-sitter &> /dev/null
then
    echo "tree-sitter not be found. Please install tree-sitter-cli and try again."
    exit 1
fi

cd ../../internal/grammar || exit 1

echo "Copying grammar.js file..."
cp ../../submodules/ProjectFlowSyntax/grammar/grammar.js .

echo "Initializing tree-sitter configuration..."
tree-sitter init-config

echo "Generating tree-sitter bindings..."
tree-sitter generate

echo "Building tree-sitter lib..."
tree-sitter build

echo "Building tree-sitter WASM..."
tree-sitter build --wasm

echo "Replacing binding.go packaging..."
cp bindings/go/binding.go .
sed -i '0,/tree_sitter_project_flow_syntax/s//grammar/' binding.go
sed -i 's/..\/..\/src/src/g' binding.go
rm -rf bindings go.mod go.sum

echo "Bindings compilation completed."
