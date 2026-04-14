using Application.Services.Interfaces;
using Domain.Entities;
using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Text;

namespace Infrastructure.Services
{
    public class SignInService : ISignInService
    {

        private readonly SignInManager<User> _signInManager;

        public SignInService(SignInManager<User> signInManager)
        {
            _signInManager = signInManager;
        }

        public async Task<bool> CheckPasswordAsync(User user, string password)
        {
            var result = await _signInManager.CheckPasswordSignInAsync(user, password, false);
            return result.Succeeded;
        }
    }
}
