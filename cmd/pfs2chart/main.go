package main

import (
	"context"
	"fmt"
	"github.com/rs/zerolog/log"
	"quickplan/pkg/pfs"
)

func main() {
	ctx := context.Background()
	tree, err := pfs.ParsePfs(ctx, "X > Y > Z")
	if err != nil {
		log.Err(err).Msg("failed to parse PFS string")
		return
	}
	if tree == nil {
		log.Error().Msg("got nil tree")
		return
	}
	root := tree.RootNode()
	fmt.Println(root.ToSexp())
}
