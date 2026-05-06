using Application.Common;
using Application.Dto;
using Application.Interfaces;
using Application.Services.Interfaces;
using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Services.Implementations
{
    public class DetectionService : IDetectionService
    {
        private readonly IDetectionRepository _detectionRepository;
        private readonly ICameraRepository _cameraRepository;
        

        public DetectionService(IDetectionRepository detectionRepository, ICameraRepository cameraRepository)
        {
            _detectionRepository = detectionRepository;
            _cameraRepository = cameraRepository;
            
        }

        public async Task<ApiResponse<DetectionDto>> CreateDetectionAsync(DetectionDto detectionDto)
        {
            

            var detection = new Detection
            {
                Name = detectionDto.Name,
                CameraId = detectionDto.CameraId,
                Description = detectionDto.Description,
                Type = detectionDto.Type,
                VideoUrl = detectionDto.VideoUrl,
                SnapShotUrl = detectionDto.SnapShotUrl
            };
            await _detectionRepository.AddDetectionAsync(detection);

            return ApiResponse<DetectionDto>.Success(detectionDto, "Detection created successfully");

        }

        public async Task<ApiResponse<List<DetectionDto>>> GetAllDetectionsAsync()
        {
            var detections = await _detectionRepository.GetAllDetectionAsync();

            var result = detections.Select(MapToDto).ToList();

            if(detections == null || !detections.Any())
            {
                return ApiResponse<List<DetectionDto>>.Fail("No detections found.");
            }

            return ApiResponse<List<DetectionDto>>.Success(result, "All detections retrieved successfully");
        }

        public async Task<ApiResponse<List<DetectionDto>>> GetDetectionsByCameraAsync(int cameraId)
        {
            var camera = await _cameraRepository.GetCameraByIdAsync(cameraId);

            if (camera == null)
            {
                return ApiResponse<List<DetectionDto>>.Fail("Camera not found.");
            }



            var detections = await _detectionRepository.GetByCameraAsync(cameraId);

            var result = detections.Select(MapToDto).ToList();

            if(detections == null || !detections.Any())
            {
                return ApiResponse<List<DetectionDto>>.Fail("No detections found for the specified camera.");
            } 

            return ApiResponse<List<DetectionDto>>.Success(result, "Detections retrieved successfully");
        }

        public async Task<ApiResponse<List<DetectionDto>>> GetDetectionsByDayAsync(DateTime date)
        {
            var detections = await _detectionRepository.GetByDayAsync(date);

            var result = detections.Select(MapToDto).ToList();

            if(detections == null || !detections.Any())
            {
                return ApiResponse<List<DetectionDto>>.Fail("No detections found in the specified date.");
            }

            return ApiResponse<List<DetectionDto>>.Success(result, "Detections retrieved successfully");
        }

        



        private DetectionDto MapToDto(Detection detection)
        {
            return new DetectionDto
            {
                Id = detection.Id,
                CameraId = detection.CameraId,
                DetectedAt = detection.DetectedAt,
                Name = detection.Name,
            };
        }




    }
}
