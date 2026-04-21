using Application.Common;
using Application.Dto;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Services.Interfaces
{
    public interface ICameraService
    {
        Task<ApiResponse<CameraDto>> CreateAsync    (CreateCameraDto createCameraDto);
        Task<ApiResponse<List<CameraDto>>> GetAllAsync();
        Task<ApiResponse<CameraDto>> GetByIdAsync(int id);
        Task<ApiResponse<bool>> UpdateAsync(int id, CreateCameraDto updateCameraDto);
        Task<ApiResponse<bool>> DeleteAsync (int id);


    }
}
