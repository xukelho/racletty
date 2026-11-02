using Racletty.Api.Authentication;
using Racletty.Api.Data;
using Racletty.Api.Endpoints;
using Racletty.Api.Services;
using Racletty.Api.Storage;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;
using System.Threading.RateLimiting;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

if (builder.Environment.IsProduction())
{
    builder.Services.Configure<ForwardedHeadersOptions>(options =>
    {
        options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
        options.ForwardLimit = 1;
        var proxyNetwork = builder.Configuration["PROXY_NETWORK"];
        if (string.IsNullOrWhiteSpace(proxyNetwork) || !System.Net.IPNetwork.TryParse(proxyNetwork, out var parsedNetwork))
            throw new InvalidOperationException("A valid PROXY_NETWORK is required in production.");
        options.KnownIPNetworks.Add(parsedNetwork);
    });
}

builder.Services.AddOpenApi();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    var permitLimit = builder.Environment.IsProduction() ? 10 : 1000;
    options.AddPolicy("authentication-login", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = permitLimit,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            }));
});

if (builder.Environment.IsProduction())
{
    var keyPath = builder.Configuration["DataProtection:KeysPath"]
        ?? throw new InvalidOperationException("DataProtection:KeysPath is required in production.");
    Directory.CreateDirectory(keyPath);
    builder.Services.AddDataProtection()
        .SetApplicationName("Racletty")
        .PersistKeysToFileSystem(new DirectoryInfo(keyPath));
}

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException(
        "Connection string 'DefaultConnection' is required.");

builder.Services.AddDbContext<RaclettyDbContext>(
    options => options.UseNpgsql(connectionString));
builder.Services.AddScoped<ICredentialValidator, DatabaseCredentialValidator>();
builder.Services.AddSingleton(TimeProvider.System);
builder.Services.AddObjectStorage(builder.Configuration);
builder.Services.AddScoped<IFileService, FileService>();
builder.Services.Configure<DrawingPreviewOptions>(builder.Configuration.GetSection(DrawingPreviewOptions.SectionName));
builder.Services.AddSingleton<IDrawingSourceParser, DxfDrawingSourceParser>();
builder.Services.AddSingleton<IDrawingSourceParser, DwgDrawingSourceParser>();
builder.Services.AddSingleton<IDrawingSourceParser, DwfxDrawingSourceParser>();
builder.Services.AddScoped<DrawingPreviewService>();
builder.Services.AddScoped<ProjectPhaseService>();
builder.Services.AddScoped<PhaseRemovalService>();
builder.Services.AddScoped<IProjectNotificationService, ProjectNotificationService>();
builder.Services.AddScoped<IStorageQuotaService, StorageQuotaService>();
builder.Services.AddScoped<FileMaintenanceProcessor>();
builder.Services.AddHostedService<ClientInvitationExpiryService>();
builder.Services.AddHostedService<FileMaintenanceService>();
if (builder.Environment.IsEnvironment("Testing"))
{
    builder.Services.AddSingleton<IDataProtectionProvider>(
        new EphemeralDataProtectionProvider());
}
builder.Services
    .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "racletty.session";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Strict;
        options.Cookie.SecurePolicy = builder.Environment.IsProduction()
            ? CookieSecurePolicy.Always
            : CookieSecurePolicy.SameAsRequest;
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
    });
builder.Services.AddAuthorization();

var app = builder.Build();

if (app.Environment.IsProduction())
{
    app.UseForwardedHeaders();
    app.UseExceptionHandler(handler => handler.Run(context =>
    {
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        return context.Response.WriteAsJsonAsync(new { error = "An unexpected error occurred." });
    }));
}

app.UseRateLimiter();

await DatabaseInitializer.InitializeAsync(app.Services);

if (!app.Environment.IsProduction()) app.MapOpenApi();
app.UseAuthentication();
app.UseAuthorization();
app.MapHealthEndpoints();
app.MapAuthenticationEndpoints();
app.MapAdministrationEndpoints();
app.MapProfileEndpoints();
app.MapCompanyEndpoints();
app.MapCompanyMemberEndpoints();
app.MapProjectEndpoints();
app.MapProjectMessageEndpoints();
app.MapProjectPartConversationEndpoints();
app.MapProjectDocumentEndpoints();
app.MapClientManagementEndpoints();
app.MapClientInvitationEndpoints();
app.MapNotificationEndpoints();
app.MapStorageEndpoints();

app.Run();

public partial class Program;
