package main

import (
	"testing"

	"github.com/google/go-cmp/cmp"
)

var testdataPatch = []struct {
	in      string
	patch   string
	want    string
	wantErr string
}{{
	// Granting access
	in:    `{ "groups": { "production": [] } }`,
	patch: `[{ "op": "add", "path": "/groups/production/0", "value": "user@example.com" }]`,
	want:  `{ "groups": { "production": ["user@example.com"] } }`,
}, {
	// Revoking
	in:    `{ "groups": { "production": ["user@example.com"] } }`,
	patch: `[{ "op": "remove", "path": "/groups/production/0" }]`,
	want:  `{ "groups": { "production": [] } }`,
}}

func Test_Patch(t *testing.T) {
	for _, tt := range testdataPatch {
		t.Run("", func(t *testing.T) {
			got, err := Patch(tt.in, tt.patch)
			if err != tt.wantErr {
				t.Errorf("Patch error mismatch:\ngot  %v\nwant %v", err, tt.wantErr)
			}
			if diff := cmp.Diff(tt.want, got); diff != "" && tt.want != "" {
				t.Errorf("Patch mismatch (-want +got):\n%s\n\ngot:\n%s\n\nwant:\n%s", diff, got, tt.want)
			}
		})
	}
}
