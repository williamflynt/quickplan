package examples

import "testing"

func TestBasic(t *testing.T) {
	c, dot := Basic()
	if dot == "" {
		t.Fatal("did not get DOT for Chart")
	}
	if c == nil {
		t.Fatal("got nil pointer for Chart")
	}
	countNodes := 0
	for _, n := range c.Nodes {
		if n.Id == "START" {
			countNodes += 1
			if n.EarliestStart != 0 &&
				n.EarliestFinish != 0 &&
				n.LatestStart != 0 &&
				n.LatestFinish != 0 &&
				n.Slack != 0 {
				t.Fatal("invalid values for 'START'")
			}
		}
		if n.Id == "A" {
			countNodes += 1
			if n.EarliestStart != 0 &&
				n.EarliestFinish != 20 &&
				n.LatestStart != 27 &&
				n.LatestFinish != 47 &&
				n.Slack != 27 {
				t.Fatal("invalid values for 'A'")
			}
		}
		if n.Id == "B" {
			countNodes += 1
			if n.EarliestStart != 0 &&
				n.EarliestFinish != 75 &&
				n.LatestStart != 0 &&
				n.LatestFinish != 75 &&
				n.Slack != 0 {
				t.Fatal("invalid values for 'B'")
			}
		}
		if n.Id == "C" {
			countNodes += 1
			if n.EarliestStart != 20 &&
				n.EarliestFinish != 50 &&
				n.LatestStart != 47 &&
				n.LatestFinish != 77 &&
				n.Slack != 27 {
				t.Fatal("invalid values for 'C'")
			}
		}
		if n.Id == "D" {
			countNodes += 1
			if n.EarliestStart != 75 &&
				n.EarliestFinish != 105 &&
				n.LatestStart != 77 &&
				n.LatestFinish != 107 &&
				n.Slack != 2 {
				t.Fatal("invalid values for 'D'")
			}
		}
		if n.Id == "E" {
			countNodes += 1
			if n.EarliestStart != 75 &&
				n.EarliestFinish != 107 &&
				n.LatestStart != 75 &&
				n.LatestFinish != 107 &&
				n.Slack != 0 {
				t.Fatal("invalid values for 'E'")
			}
		}
		if n.Id == "END" {
			countNodes += 1
			if n.EarliestStart != 107 &&
				n.EarliestFinish != 107 &&
				n.LatestStart != 107 &&
				n.LatestFinish != 107 &&
				n.Slack != 0 {
				t.Fatal("invalid values for 'END'")
			}
		}
	}

	if countNodes != 7 {
		t.Fatalf("got %v nodes, expected 7", countNodes)
	}
}
