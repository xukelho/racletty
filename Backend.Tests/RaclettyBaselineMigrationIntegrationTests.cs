using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql;
using Racletty.Api.Data;

namespace Racletty.Api.IntegrationTests;

public sealed class RaclettyBaselineMigrationIntegrationTests
{
    [Fact]
    public async Task InitialCreateBuildsTheCurrentSchemaOnAnEmptyDatabase()
    {
        var adminConnectionString = Environment.GetEnvironmentVariable("RACLETTY_TEST_ADMIN_CONNECTION")
            ?? "Host=localhost;Port=5837;Database=postgres;Username=racletty;Password=racletty_dev_password";
        var databaseName = $"racletty_baseline_{Guid.NewGuid():N}";
        var databaseConnectionString = new NpgsqlConnectionStringBuilder(adminConnectionString)
        {
            Database = databaseName,
            Pooling = false
        }.ConnectionString;

        await using (var adminConnection = new NpgsqlConnection(adminConnectionString))
        {
            await adminConnection.OpenAsync();
            await using var createDatabase = adminConnection.CreateCommand();
            createDatabase.CommandText = $"CREATE DATABASE \"{databaseName}\"";
            await createDatabase.ExecuteNonQueryAsync();
        }

        try
        {
            var options = new DbContextOptionsBuilder<RaclettyDbContext>()
                .UseNpgsql(databaseConnectionString)
                .Options;
            await using var db = new RaclettyDbContext(options);
            var migrator = db.GetService<IMigrator>();

            Assert.Contains(db.Database.GetMigrations(), migration => migration.EndsWith("_InitialCreate"));
            await migrator.MigrateAsync();

            Assert.True(await db.Database.CanConnectAsync());
            Assert.NotEmpty(await db.Roles.ToArrayAsync());
            var storageConfiguration = await db.StorageConfigurations.SingleAsync();
            Assert.Equal(StorageConfiguration.SingletonId, storageConfiguration.Id);
            Assert.Equal(StorageConfiguration.DefaultBaseLimitBytes, storageConfiguration.BaseLimitBytes);
            Assert.Equal(AuditActors.System, storageConfiguration.UpdatedBy);
            Assert.Equal(0, await db.Users.CountAsync());
            Assert.Empty(await db.ProjectDocuments.ToArrayAsync());
        }
        finally
        {
            NpgsqlConnection.ClearAllPools();
            await using var adminConnection = new NpgsqlConnection(adminConnectionString);
            await adminConnection.OpenAsync();
            await using var terminateConnections = adminConnection.CreateCommand();
            terminateConnections.CommandText = """
                SELECT pg_terminate_backend(pid)
                FROM pg_stat_activity
                WHERE datname = @databaseName
                  AND pid <> pg_backend_pid();
                """;
            terminateConnections.Parameters.AddWithValue("databaseName", databaseName);
            await terminateConnections.ExecuteNonQueryAsync();
            await using var dropDatabase = adminConnection.CreateCommand();
            dropDatabase.CommandText = $"DROP DATABASE IF EXISTS \"{databaseName}\"";
            await dropDatabase.ExecuteNonQueryAsync();
        }
    }
}
