using Application.Common;
using Application.Dto;
using Application.Interfaces;
using Application.Services.Interfaces;
using Domain.Entities;
using Microsoft.AspNetCore.Identity;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Services.Implementations
{
    public class UserManagementService : IUserManagmentService
    {

        private readonly IUserRepository _userRepository;
        private readonly ISignInService _signInService;
        private readonly UserManager<User> _userManager;
        private readonly IUserCameraRepository _userCameraRepository;

        public UserManagementService(IUserRepository userRepository, ISignInService signInService, UserManager<User> userManager, IUserCameraRepository userCameraRepository)
        {
            _userRepository = userRepository;
            _signInService = signInService;
            _userManager = userManager;
            _userCameraRepository = userCameraRepository;
        }



        public async Task<ApiResponse<bool>> CreateUserAync(CreateUserDto createuserDto)
        {
            if (await _userRepository.IsEmailExistsAsync(createuserDto.Email))
                return ApiResponse<bool>.Fail("Email already exists");

            var user = new User
            {
                FirstName = createuserDto.FirstName,
                LastName = createuserDto.LastName,
                Email = createuserDto.Email,
                UserName = createuserDto.UserName
            };

            await _userRepository.CreateUserAsync(user, createuserDto.Password);



            await _userManager.AddToRoleAsync(user, "User");

            return ApiResponse<bool>.Success(true , "User created successfully");
        }

        public async Task<ApiResponse<bool>> DeleteUserAsync(string id)
        {
            if(string.IsNullOrEmpty(id))
                return ApiResponse<bool>.Fail("User Id is required");

            var user = await _userRepository.GetByIdAsync(id, "User");
            if (user == null)
            {
                return ApiResponse<bool>.Fail("User not found");
            }

            await _userRepository.DeleteUserAsync(user);
            return ApiResponse<bool>.Success(true, "User deleted successfully");
        }

        public async Task<ApiResponse<List<UserDto>>> GetAllUsers()
        {

            var users = await _userRepository.GetAllUsersAsync("User");
            if (users == null || users.Count == 0)
            {
                return ApiResponse<List<UserDto>>.Fail("No users found");
            }

            var userDtos = new List<UserDto>();
            foreach (var user in users)
            {
                userDtos.Add(new UserDto
                {
                    
                    Id = user.Id,
                    UserName = user.UserName,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName
                });
            }
            return ApiResponse<List<UserDto>>.Success(userDtos, "Users retrieved successfully");

        }

        public async Task<ApiResponse<UserDto>> GetUserByEmail(string email)
        {

            if (!await _userRepository.IsEmailExistsAsync(email))
                return ApiResponse<UserDto>.Fail("Email not found");

            var user = await _userRepository.GetByEmailAsync(email , "User");
            if(user == null)
            {
                return ApiResponse<UserDto>.Fail("This email is not a user");
            }

            return ApiResponse<UserDto>.Success(new UserDto
            {
                Id = user.Id,
                UserName = user.UserName,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName
            }, "User retrieved successfully");



        }

        public async Task<ApiResponse<UserDto>> GetUserById(string id)
        {
            var user = await _userRepository.GetByIdAsync(id, "User");
            if (user == null)
            {
                return ApiResponse<UserDto>.Fail("There Is No User With The Given Id");
            }

            return ApiResponse<UserDto>.Success(new UserDto
            {
                Id = user.Id,
                    UserName = user.UserName,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName
                }, "User retrieved successfully");
            }

        //public async Task<ApiResponse<bool>> UpdateUserAsync(CreateUserDto updateUserDto)
        //{
        //    if(updateUserDto == null)
        //        return ApiResponse<bool>.Fail("User data is required");

        //    var user = await _userRepository.GetByIdAsync(updateUserDto.Id, "User");
        //    if (user == null)
        //    {
        //        return ApiResponse<bool>.Fail("User not found");
        //    }   


        //}
    }
}
