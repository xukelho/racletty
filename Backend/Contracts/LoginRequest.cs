using System.ComponentModel.DataAnnotations;

namespace Racletty.Api.Contracts;

public sealed record LoginRequest(
    [property: Required, MaxLength(256)] string Username,
    [property: Required, MaxLength(1024)] string Password);
