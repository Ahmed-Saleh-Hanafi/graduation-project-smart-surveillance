using Application.Common;
using Application.Dto;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Services.Interfaces
{
    public interface IFaceProcessingService
    {
        Task<ApiResponse<int?>> HandleDetectionAsync(int cameraId, FaceResultDto result);
    }
}
