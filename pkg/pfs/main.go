//go:generate ./generate_bindings.sh

package pfs

import (
	"context"
	treesitter "github.com/tree-sitter/go-tree-sitter"
	"quickplan/internal/grammar"
)

type ASTNode struct {
	Type     string     `json:"type"`
	Value    string     `json:"value,omitempty"`
	Children []*ASTNode `json:"children,omitempty"`
}

func ParseToAST(node *treesitter.Node, inputBytes []byte) *ASTNode {
	if node == nil {
		return nil
	}

	astNode := &ASTNode{
		Type:     node.GrammarName(),
		Value:    "",
		Children: make([]*ASTNode, 0),
	}

	if node.ChildCount() == 0 {
		startPos, endPos := node.ByteRange()
		bytes := inputBytes[startPos:endPos]
		astNode.Value = string(bytes)
	}

	for i := 0; i < int(node.ChildCount()); i++ {
		child := node.Child(uint(i))
		childAstNode := ParseToAST(child, inputBytes)
		if childAstNode.Type == "whitespace" || childAstNode.Type == "comment" {
			continue
		}
		astNode.Children = append(astNode.Children, ParseToAST(child, inputBytes))
	}

	return astNode
}

func ParseToTree(ctx context.Context, inputBytes []byte) (*treesitter.Tree, error) {
	parser := treesitter.NewParser()
	defer parser.Close()
	err := parser.SetLanguage(treesitter.NewLanguage(grammar.Language()))
	if err != nil {
		return nil, err
	}
	return parser.ParseCtx(ctx, inputBytes, nil), nil
}
