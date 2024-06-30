using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using RollCall;
using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.AspNetCore.Components.WebAssembly.Authentication;

var builder = WebAssemblyHostBuilder.CreateDefault(args);
var services = builder.Services;

// Add the main app component to the root of the app
builder.RootComponents.Add<App>("#app");

// Add a HeadOutlet component for injecting content into the head element
builder.RootComponents.Add<HeadOutlet>("head::after");

// Configure an HTTP client with the base address of the app
builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });

// Configure OIDC (OpenID Connect) Authentication with Google
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
    options.ProviderOptions.ResponseMode = "query";

    //// Configure  options.ProviderOptions.DefaultScopes.Add("openid");
    //options.ProviderOptions.DefaultScopes.Add("profile");
    //options.ProviderOptions.DefaultScopes.Add("email");
    //options.ProviderOptions.ResponseMode = "query";
});

//builder.AddAuthorizationCore(
//Options => {
//    Options.addpolicy("admin", policy => {
//    Policy.requireRole(RoleScopes.YOURADMINROLE));
//});



// Build and run the app
await builder.Build().RunAsync();
