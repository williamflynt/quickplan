package main

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/rs/zerolog/log"
	"quickplan/pkg/pfs"
)

func main() {
	ctx := context.Background()
	input := "X > Y > Z\n A > Y  \nB>Z"
	inputBytes := []byte(input)
	tree, err := pfs.ParseToTree(ctx, inputBytes)
	if err != nil {
		log.Err(err).Msg("failed to parse PFS string")
		return
	}
	if tree == nil {
		log.Error().Msg("got nil tree")
		return
	}
	defer tree.Close()
	// TODO(wf 1 Dec 2024): Convert to Chart.
	root := tree.RootNode()
	fmt.Println(root.ToSexp())
	ast := pfs.ParseToAST(root, inputBytes)
	project, err := pfs.ASTToProject(ast, nil)
	if err != nil {
		log.Err(err).Msg("failed to parse AST to Project")
	}
	bytes, _ := json.MarshalIndent(project, "", "  ")
	fmt.Println(string(bytes))
}
