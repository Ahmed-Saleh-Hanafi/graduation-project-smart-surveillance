using Application.Common;
using Application.Dto;
using Application.Interfaces;
using Application.Services.Interfaces;
using Domain.Entities;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Services.Implementations
{
    public class DetectionService : IDetectionService
    {
        private readonly IDetectionRepository _detectionRepository;
        private readonly ICameraRepository _cameraRepository;
        private readonly IImageService _imageService;
        

        public DetectionService(IDetectionRepository detectionRepository, ICameraRepository cameraRepository, IImageService imageService)
        {
            _detectionRepository = detectionRepository;
            _cameraRepository = cameraRepository;
            _imageService = imageService;
        }

        public async Task<ApiResponse<CreateDetectionDto>> CreateDetectionAsync(CreateDetectionDto detectionDto)
        {

            var camera = await _cameraRepository.GetCameraByIdAsync(detectionDto.CameraId);
            if (camera == null)
            {
                return ApiResponse<CreateDetectionDto>.Fail("Camera not found.");
            }
            if (detectionDto.SnapshotFile == null)
            {
                return ApiResponse<CreateDetectionDto>.Fail("Snapshot file is required.");
            }

            var FileUrl = await _imageService.SaveImageAsync(detectionDto.SnapshotFile);


            var detection = new Detection
            {
                Name = detectionDto.Name,
                CameraId = detectionDto.CameraId,
                Description = detectionDto.Description,
                Type = detectionDto.Type,
                VideoUrl = detectionDto.VideoUrl,
                SnapShotUrl = FileUrl,
            };
            await _detectionRepository.AddDetectionAsync(detection);
            

            return ApiResponse<CreateDetectionDto>.Success(detectionDto, "Detection created successfully");

        }






        public async Task<ApiResponse<List<DetectionDto>>> GetAllDetectionsAsync()
        {
            var detections = await _detectionRepository.GetAllDetectionAsync();

            

            if(detections == null || !detections.Any())
            {
                return ApiResponse<List<DetectionDto>>.Fail("No detections found.");
            }
            var result = detections.Select(MapToDto).ToList();

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

            

            if(detections == null || !detections.Any())
            {
                return ApiResponse<List<DetectionDto>>.Fail("No detections found for the specified camera.");
            }
            var result = detections.Select(MapToDto).ToList();

            return ApiResponse<List<DetectionDto>>.Success(result, "Detections retrieved successfully");
        }

        public async Task<ApiResponse<List<DetectionDto>>> GetDetectionsByDayAsync(DateTime date)
        {
            var detections = await _detectionRepository.GetByDayAsync(date);

           

            if(detections == null || !detections.Any())
            {
                return ApiResponse<List<DetectionDto>>.Fail("No detections found in the specified date.");
            }
            var result = detections.Select(MapToDto).ToList();

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
                Description = detection.Description,
                Type = detection.Type,
                VideoUrl = detection.VideoUrl,
                SnapShotUrl = detection.SnapShotUrl
            };
        }




    }
}
