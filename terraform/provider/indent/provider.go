// Package okta terraform configuration for an okta site
package indent

import (
	"context"
	"log"

	"github.com/hashicorp/go-hclog"
	"github.com/hashicorp/terraform-plugin-sdk/v2/diag"
	"github.com/hashicorp/terraform-plugin-sdk/v2/helper/schema"
)

// Provider establishes a client connection to Indent
// determined by its schema string values
func Provider() *schema.Provider {
	return &schema.Provider{
		Schema: map[string]*schema.Schema{
			"api_token": {
				Type:        schema.TypeString,
				Optional:    true,
				DefaultFunc: schema.EnvDefaultFunc("INDENT_API_TOKEN", nil),
				Description: "API Token granting privileges to Indent API.",
			},
			"api_domain": {
				Type:        schema.TypeString,
				Optional:    true,
				DefaultFunc: schema.EnvDefaultFunc("INDENT_API_DOMAIN", "platform.indentapis.com"),
				Description: "The Indent Platform API domain. (Use 'platform.marble.indent.services' for testing)",
			},
			"backoff": {
				Type:        schema.TypeBool,
				Optional:    true,
				Default:     true,
				Description: "Use exponential back off strategy for rate limits.",
			},
			"min_wait_seconds": {
				Type:        schema.TypeInt,
				Optional:    true,
				Default:     30,
				Description: "minimum seconds to wait when rate limit is hit. We use exponential backoffs when backoff is enabled.",
			},
			"max_wait_seconds": {
				Type:        schema.TypeInt,
				Optional:    true,
				Default:     300,
				Description: "maximum seconds to wait when rate limit is hit. We use exponential backoffs when backoff is enabled.",
			},
			"max_retries": {
				Type:        schema.TypeInt,
				Optional:    true,
				Default:     5,
				Description: "maximum number of retries to attempt before erroring out.",
			},
			"parallelism": {
				Type:        schema.TypeInt,
				Optional:    true,
				Default:     1,
				Description: "Number of concurrent requests to make within a resource where bulk operations are not possible. Take note of https://developer.okta.com/docs/api/getting_started/rate-limits.",
			},
			"log_level": {
				Type:        schema.TypeInt,
				Optional:    true,
				Default:     int(hclog.Error),
				Description: "providers log level. Minimum is 1 (TRACE), and maximum is 5 (ERROR)",
			},
			"max_api_capacity": {
				Type:        schema.TypeInt,
				Optional:    true,
				DefaultFunc: schema.EnvDefaultFunc("MAX_API_CAPACITY", 100),
				Description: "(Experimental) sets what percentage of capacity the provider can use of the total rate limit " +
					"capacity while making calls to the Indent API endpoints. Indent API rate limits in one minute buckets. " +
					"See Indent API Rate Limits: https://indent.com/docs/api-rate-limits/",
			},
			"request_timeout": {
				Type:        schema.TypeInt,
				Optional:    true,
				Default:     0,
				Description: "Timeout for single request (in seconds) which is made to Indent, the default is `0` (means no limit is set). The maximum value can be `300`.",
			},
		},
		ResourcesMap:         map[string]*schema.Resource{},
		DataSourcesMap:       map[string]*schema.Resource{},
		ConfigureContextFunc: providerConfigure,
	}
}

func providerConfigure(ctx context.Context, d *schema.ResourceData) (interface{}, diag.Diagnostics) {
	log.Printf("[INFO] Initializing Indent client")
	// TODO: init Indent client and return config

	return nil, nil
}
