using Application.Common;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Services.Interfaces
{
    public interface IUserCameraService
    {
        Task<ApiResponse<bool>> AssignUserToCameraAsync(string userId, int cameraId);
        Task<ApiResponse<bool>> UnassignUserFromCameraAsync(string userId, int cameraId);
        Task<ApiResponse<List<int>>> GetCameraIdsByUserIdAsync(string userId);

    }
}
