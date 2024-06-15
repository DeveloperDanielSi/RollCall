using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Microsoft.AspNetCore.Components.WebAssembly.Authentication;
using System.Net.Http;
using RollCall;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");

builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });

// Configure OIDC Authentication with Google
builder.Services.AddOidcAuthentication(options =>
{
    options.ProviderOptions.Authority = "https://accounts.google.com";
    options.ProviderOptions.ClientId = "968520920745-bghd5ldv30hv1ofvuh4gqm201s7p95sj.apps.googleusercontent.com";
    options.ProviderOptions.ResponseType = "code";
    options.ProviderOptions.RedirectUri = builder.HostEnvironment.BaseAddress + "authentication/login-callback";
    options.ProviderOptions.PostLogoutRedirectUri = builder.HostEnvironment.BaseAddress;

    options.ProviderOptions.DefaultScopes.Add("openid");
    options.ProviderOptions.DefaultScopes.Add("profile");
    options.ProviderOptions.DefaultScopes.Add("email");

    // Use PKCE by setting the ResponseMode to 'query'
    options.ProviderOptions.ResponseMode = "query";
});

await builder.Build().RunAsync();