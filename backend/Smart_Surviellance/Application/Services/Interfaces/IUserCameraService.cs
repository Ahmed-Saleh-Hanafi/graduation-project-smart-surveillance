using Application.Common;
using Application.Dto;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Services.Interfaces
{
    public interface IUserCameraService
    {
        Task<ApiResponse<bool>> AssignUserToCameraAsync(string userId, int cameraId);
        Task<ApiResponse<bool>> UnassignUserFromCameraAsync(string userId, int cameraId);
        Task<ApiResponse<List<CameraDto>>> GetUnassignedCamerasByUserIdAsync(string userId);
        Task<ApiResponse<List<CameraDto>>> GetCameraIdsByUserIdAsync(string userId);

    }
}
