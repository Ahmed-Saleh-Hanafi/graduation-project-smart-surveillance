using Application.Common;
using Application.Dto;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Services.Interfaces
{
    public interface ISensorService
    {
        Task<ApiResponse<bool>> AddSensorAsync(CreateSensorDto createSensorDto);
        Task<ApiResponse<List<SensorDto>>> GetAllSensorsAsync();
        Task<ApiResponse<SensorDto>> GetSensorByIdAsync(int sensorId);
        Task<ApiResponse<List<SensorReadingDto>>> GetSensorReadingsAsync(int sensorId, int take = 50);
        Task<ApiResponse<SensorReadingDto>> RecordReadingAsync(int sensorId, double value);
        Task<ApiResponse<bool>> DeleteSensorAsync(int sensorId);
        Task<ApiResponse<bool>> UpdateSensorAsync(SensorDto sensorDto);


    }
}
