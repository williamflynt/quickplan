//go:generate ./generate_bindings.sh

package pfs

import (
	"context"
	treesitter "github.com/tree-sitter/go-tree-sitter"
	"quickplan/internal/grammar"
)

type Project struct {
	Tasks        map[string]Task      `json:"tasks" yaml:"tasks"`
	Milestones   map[string]Milestone `json:"milestones" yaml:"milestones"`
	Resources    map[string]Resource  `json:"resources" yaml:"resources"`
	Clusters     map[string]Cluster   `json:"clusters" yaml:"clusters"`
	Dependencies []Dependency         `json:"dependencies" yaml:"dependencies"`
	Assignments  []Assignment         `json:"assignments" yaml:"assignments"`
}

type Task struct {
	Id         string            `json:"id" yaml:"id"`
	Attributes map[string]string `json:"attributes" yaml:"attributes"`
}

type Milestone struct {
	Id         string            `json:"id" yaml:"id"`
	Attributes map[string]string `json:"attributes" yaml:"attributes"`
}

type Resource struct {
	Id         string            `json:"id" yaml:"id"`
	Attributes map[string]string `json:"attributes" yaml:"attributes"`
}

type Cluster struct {
	Id         string            `json:"id" yaml:"id"`
	Attributes map[string]string `json:"attributes" yaml:"attributes"`
	Tasks      map[string]string `json:"tasks" yaml:"tasks"`
	Milestones map[string]string `json:"milestones" yaml:"milestones"`
}

type Dependency struct {
	Src  string `json:"src" yaml:"src"`
	Dest string `json:"dest" yaml:"dest"`
}

type Assignment struct {
	TaskId     string `json:"taskId" yaml:"taskId"`
	ResourceId string `json:"resourceId" yaml:"resourceId"`
}

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
