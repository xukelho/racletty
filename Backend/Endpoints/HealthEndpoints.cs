using Racletty.Api.Contracts;
using Racletty.Api.Data;
using Racletty.Api.Storage;
using Microsoft.EntityFrameworkCore;

namespace Racletty.Api.Endpoints;

public static class HealthEndpoints
{
    public static IEndpointRouteBuilder MapHealthEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/health", () => TypedResults.Ok(new HealthResponse("healthy")))
            .WithName("GetHealth")
            .WithTags("Health")
            .Produces<HealthResponse>();

        endpoints.MapGet("/api/ready", async (RaclettyDbContext db, IObjectStore store, CancellationToken ct) =>
        {
            using var timeout = CancellationTokenSource.CreateLinkedTokenSource(ct);
            timeout.CancelAfter(TimeSpan.FromSeconds(3));
            try
            {
                if (!await db.Database.CanConnectAsync(timeout.Token))
                    return Results.StatusCode(StatusCodes.Status503ServiceUnavailable);
                await store.GetMetadataAsync("_health/readiness-probe", timeout.Token);
                return Results.Ok(new HealthResponse("ready"));
            }
            catch (OperationCanceledException) when (!ct.IsCancellationRequested)
            {
                return Results.StatusCode(StatusCodes.Status503ServiceUnavailable);
            }
            catch
            {
                return Results.StatusCode(StatusCodes.Status503ServiceUnavailable);
            }
        }).WithName("GetReadiness").WithTags("Health");

        return endpoints;
    }
}
