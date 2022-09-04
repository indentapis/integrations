package main

import (
	"fmt"

	"github.com/gopherjs/gopherjs/js"
	"github.com/tailscale/hujson"
)

func main() {
	exports := js.Module.Get("exports")
	exports.Set("ParseToJSON", ParseToJSON)
	exports.Set("Patch", Patch)
}

func ParseToJSON(s string) (string, error) {
	acl, err := hujson.Parse([]byte(s))
	if err != nil {
		return "", err
	}
	acl.Standardize()
	acl.Format()
	return string(acl.Pack()), nil
}

func Patch(s string, patch string) (string, string) {
	acl, err := hujson.Parse([]byte(s))
	if err != nil {
		return "", fmt.Errorf("failed to parse ACL: %v", err).Error()
	}
	if err = acl.Patch([]byte(patch)); err != nil {
		return "", fmt.Errorf("failed to patch ACL: %v", err).Error()
	}
	return acl.String(), ""
}
