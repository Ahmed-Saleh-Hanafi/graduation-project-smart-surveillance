using Application.Common;
using Application.Dto;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Services.Interfaces
{
    public interface IAIScheduleService
    {

        Task<ApiResponse<AIScheduleDto>> CreateAsync(CreateAIScheduleDto schedule);
        Task<ApiResponse<List<AIScheduleDto>>> GetAllAsync();
        Task<ApiResponse<bool>> DeleteAsync(int id);
        Task<ApiResponse<bool>> UpdateAsync(AIScheduleDto schedule);
        Task<ApiResponse<bool>> ToggleAsync(int id, bool isActive);
        Task<ApiResponse<List<AIScheduleDto>>> GetByCameraIdAsync(int cameraId);

        Task<ApiResponse<bool>> DeleteIntervalAsync(int scheduleId, int intervalId);

    }
}
