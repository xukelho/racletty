using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Racletty.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class SeedDefaultStorageConfiguration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                INSERT INTO storage_configuration (id, base_limit_bytes, updated_at, updated_by)
                VALUES (1, 5000000000, '1970-01-01 00:00:00+00', -999)
                ON CONFLICT (id) DO NOTHING;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "storage_configuration",
                keyColumn: "id",
                keyValue: 1);
        }
    }
}
