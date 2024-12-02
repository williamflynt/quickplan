//go:generate ./generate_bindings.sh

package pfs

import (
	"context"
	treesitter "github.com/tree-sitter/go-tree-sitter"
	"quickplan/internal/grammar"
)

func ParsePfs(ctx context.Context, input string) (*treesitter.Tree, error) {
	parser := treesitter.NewParser()
	defer parser.Close()
	err := parser.SetLanguage(treesitter.NewLanguage(grammar.Language()))
	if err != nil {
		return nil, err
	}
	return parser.ParseCtx(ctx, []byte(input), nil), nil
}
