using Application.Common;
using Application.Dto;
using Application.Interfaces;
using Application.Services.Interfaces;
using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Services.Implementations
{
    public class AuthService : IAuthService
    {

        private readonly IUserRepository _userRepository;
        private readonly ITokenService _tokenService;
        private readonly ISignInService _signInService;


        public AuthService(IUserRepository userRepository, ITokenService tokenService, ISignInService signInService)
        {
            _userRepository = userRepository;
            _tokenService = tokenService;
            _signInService = signInService;
        }

        public async Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginDto loginDto)
        {
            var user = await _userRepository.GetByEmailAsync(loginDto.Email);

            if (user == null)
                return ApiResponse<AuthResponseDto>.Fail("Invalid credentials");

            var result = await _signInService.CheckPasswordAsync(user, loginDto.Password);

            if (!result)
                return ApiResponse<AuthResponseDto>.Fail("Invalid credentials");

            var token = _tokenService.CreateToken(user);

            return ApiResponse<AuthResponseDto>.Success(new AuthResponseDto
            {
                Email = user.Email,
                Token = token
            },"User logged in successfully");
        }

        public async Task<ApiResponse<AuthResponseDto>> RegisterAsync(RegisterDto registerDto)
        {
            if (await _userRepository.IsEmailExistsAsync(registerDto.Email))
                return ApiResponse<AuthResponseDto>.Fail("Email already exists");

            var user = new User
            {
                FirstName = registerDto.FirstName,
                LastName = registerDto.LastName,
                Email = registerDto.Email,
                UserName = registerDto.UserName
            };

            await _userRepository.CreateUserAsync(user, registerDto.Password);

            

            return ApiResponse<AuthResponseDto>.SuccessNoData("User registered successfully");
        }
    }
}
