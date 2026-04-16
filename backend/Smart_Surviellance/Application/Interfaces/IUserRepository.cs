using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Interfaces
{
    public interface IUserRepository
    {
        Task<bool> IsEmailExistsAsync(string email);
        Task<User> GetByEmailAsync(string email);
        Task CreateUserAsync(User user, string password);
    }
}
