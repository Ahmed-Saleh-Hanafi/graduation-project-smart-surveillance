using Application.Common;
using Application.Dto;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Services.Interfaces
{
    public interface IAuthService
    {

         Task<ApiResponse<AuthResponseDto>> RegisterAsync(RegisterDto registerDto);
            
        Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginDto loginDto);

    }
}
