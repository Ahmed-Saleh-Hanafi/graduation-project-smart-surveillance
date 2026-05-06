using Application.Common;
using Application.Dto;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Services.Interfaces
{
    public interface IUserManagmentService
    {

        Task<ApiResponse<bool>> CreateUserAync(CreateUserDto createuserDto);
        Task<ApiResponse<List<UserDto>>> GetAllUsers();
        Task<ApiResponse<UserDto>> GetUserByEmail(string email);
        Task<ApiResponse<UserDto>> GetUserById(string id);
        Task<ApiResponse<bool>> DeleteUserAsync(string id);
        Task<ApiResponse<bool>> UpdateUserAsync(CreateUserDto updateUserDto);


    }
}
