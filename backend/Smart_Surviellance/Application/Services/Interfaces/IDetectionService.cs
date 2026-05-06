using Application.Common;
using Application.Dto;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Services.Interfaces
{
    public interface IDetectionService
    {


        Task<ApiResponse<CreateDetectionDto>> CreateDetectionAsync(CreateDetectionDto detectionDto);
        Task<ApiResponse<List<DetectionDto>>> GetAllDetectionsAsync();
        Task<ApiResponse<List<DetectionDto>>> GetDetectionsByCameraAsync(int cameraId);
        Task<ApiResponse<List<DetectionDto>>> GetDetectionsByDayAsync(DateTime date);
        
    }
}
