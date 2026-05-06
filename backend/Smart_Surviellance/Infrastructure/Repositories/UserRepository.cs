using Application.Interfaces;
using Domain.Entities;
using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Text;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly UserManager<User> _userManager;

        public UserRepository(UserManager<User> userManager)
        {
            _userManager = userManager;
        }

        public async Task CreateUserAsync(User user, string password)
        {
            var result = await _userManager.CreateAsync(user, password);

            if(!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new Exception(errors);
            }

        }

        public async Task<List<User>> GetAllUsersAsync()
        {
            return await _userManager.Users.ToListAsync();            

        }

        public async Task<List<User>> GetAllUsersAsync(string role)
        {
            var users= await _userManager.Users.ToListAsync();
            if (users == null)
                return null;

            var roleUsers = new List<User>();
            foreach (var user in users)
            {
                if (await _userManager.IsInRoleAsync(user, role))
                {
                    roleUsers.Add(user);
                }
            }

            return roleUsers;

            

        }

        public async Task<User> GetByEmailAsync(string email)
        {           

            return await _userManager.FindByEmailAsync(email);
        }

        public async Task<User> GetByEmailAsync(string email , string role)
        {
            var user = await _userManager.FindByEmailAsync(email);

            if (user == null)
                return null;

            if (!await _userManager.IsInRoleAsync(user, role))
                return null;

            return user;

        }



        public async Task<bool> IsEmailExistsAsync(string email)
        {
            return await _userManager.FindByEmailAsync(email) != null;
        }

        public async Task<User> GetByIdAsync(string id)
        {
            return await _userManager.FindByIdAsync(id);
        }

        public async Task<User> GetByIdAsync(string id, string role)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
                return null;

            if (!await _userManager.IsInRoleAsync(user, role))
                return null;

            return user;
        }

        public async Task DeleteUserAsync(User user)
        {
            var result = await _userManager.DeleteAsync(user);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new Exception(errors);
            }
        }

        public async Task UpdateUserAsync(User user)
        {
            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new Exception(errors);
            }
        }

    }
}
