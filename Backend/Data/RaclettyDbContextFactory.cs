using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Racletty.Api.Data;

public sealed class RaclettyDbContextFactory
    : IDesignTimeDbContextFactory<RaclettyDbContext>
{
    public RaclettyDbContext CreateDbContext(string[] args)
    {
        var connectionString =
            Environment.GetEnvironmentVariable(
                "ConnectionStrings__DefaultConnection") ??
            "Host=localhost;Port=5837;Database=racletty;Username=racletty;Password=racletty_dev_password";

        var options = new DbContextOptionsBuilder<RaclettyDbContext>()
            .UseNpgsql(connectionString)
            .Options;

        return new RaclettyDbContext(options);
    }
}
