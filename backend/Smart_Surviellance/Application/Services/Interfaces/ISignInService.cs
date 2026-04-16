using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Services.Interfaces
{
    public interface ISignInService
    {
        Task<bool> CheckPasswordAsync(User user, string password);
    }
}
