using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using RollCall;

var builder = WebAssemblyHostBuilder.CreateDefault(args);

// Add the main app component to the root of the app
builder.RootComponents.Add<App>("#app");

// Add a HeadOutlet component for injecting content into the head element
builder.RootComponents.Add<HeadOutlet>("head::after");

// Configure an HTTP client with the base address of the app
builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });

// Configure OIDC (OpenID Connect) Authentication with Google
builder.Services.AddOidcAuthentication(options =>
{
    // Set the authority to Google's OAuth 2.0 server
    options.ProviderOptions.Authority = "https://accounts.google.com";

    // Client ID obtained from Google Developer Console
    options.ProviderOptions.ClientId = "968520920745-bghd5ldv30hv1ofvuh4gqm201s7p95sj.apps.googleusercontent.com";

    // Use authorization code flow
    options.ProviderOptions.ResponseType = "code";

    // Redirect URI after login
    options.ProviderOptions.RedirectUri = builder.HostEnvironment.BaseAddress + "authentication/login-callback";

    // Redirect URI after logout
    options.ProviderOptions.PostLogoutRedirectUri = builder.HostEnvironment.BaseAddress;

    // Add default scopes for OpenID Connect
    options.ProviderOptions.DefaultScopes.Add("openid");
    options.ProviderOptions.DefaultScopes.Add("profile");
    options.ProviderOptions.DefaultScopes.Add("email");

    // Use Proof Key for Code Exchange (PKCE) by setting the response mode to 'query'
    options.ProviderOptions.ResponseMode = "query";
});

// Build and run the app
await builder.Build().RunAsync();
