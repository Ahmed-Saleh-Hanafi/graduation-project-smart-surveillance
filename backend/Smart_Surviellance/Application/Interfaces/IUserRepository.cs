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
        Task<User> GetByEmailAsync(string email, string role);
        Task CreateUserAsync(User user, string password);
        Task<List<User>> GetAllUsersAsync();
        Task<List<User>> GetAllUsersAsync(string role);
        Task<User> GetByIdAsync(string id);
        Task<User> GetByIdAsync(string id, string role);
        Task DeleteUserAsync(User user);
        Task UpdateUserAsync(User user);

    }
}
