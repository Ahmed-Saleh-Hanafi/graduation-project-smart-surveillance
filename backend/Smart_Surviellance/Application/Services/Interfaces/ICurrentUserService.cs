using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Services.Interfaces
{
    public interface ICurrentUserService
    {
        string? UserId { get; }
        bool IsAdmin { get; }
    }
}
