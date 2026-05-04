using Application.Common;
using Application.Dto;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Services.Interfaces
{
    public interface IFaceService
    {

        Task<ApiResponse<bool>> CreateFaceAsync (CreateFaceDto createFaceDto);

        Task<ApiResponse<List<FaceDto>>> GetFacesByCameraIdAsync(int cameraId);

        Task<ApiResponse<List<FaceDto>>> GetAllFacesAsync();

        Task<ApiResponse<bool>> DeleteFaceAsync(int faceId);



    }
}
