// Package main terraform initial entrypoint & redirect to the okta package
package main

import (
	"github.com/hashicorp/terraform-plugin-sdk/v2/plugin"
	"github.com/indentapis/integrations/terraform/provider/indent"
)

func main() {
	plugin.Serve(&plugin.ServeOpts{
		ProviderFunc: indent.Provider,
	})
}
