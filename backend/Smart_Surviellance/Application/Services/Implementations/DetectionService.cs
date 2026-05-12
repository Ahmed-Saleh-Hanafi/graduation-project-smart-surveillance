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
        private readonly IAlertNotifier _alertNotifier; 
        

        public DetectionService(IDetectionRepository detectionRepository, ICameraRepository cameraRepository, IImageService imageService, IAlertNotifier alertNotifier)
        {
            _detectionRepository = detectionRepository;
            _cameraRepository = cameraRepository;
            _imageService = imageService;
            _alertNotifier = alertNotifier;
        }

        public async Task<ApiResponse<CreateDetectionDto>> CreateDetectionAsync(CreateDetectionDto detectionDto)
        {

            var camera = await _cameraRepository.GetCameraByIdAsync(detectionDto.CameraId);
            if (camera == null)
            {
                return ApiResponse<CreateDetectionDto>.Fail("Camera not found.");
            }

            detectionDto.Name = "AI Detection";
            //face , abnormal , weapon

            if(detectionDto.Type == "face")
            {
                detectionDto.Description = $"Unknown Face Has been Detected by {camera.Name} camera with id {camera.Id}";
            }
            if (detectionDto.Type == "abnormal")
            {
                detectionDto.Description = $"Abnormal Behavior Has been Detected by {camera.Name} camera with id {camera.Id}";
            } 
            if (detectionDto.Type == "weapon")
            {
                detectionDto.Description = $"Weapon Has been Detected by {camera.Name} camera with id {camera.Id}";
            }



            var detection = new Detection
            {
                Name = detectionDto.Name,
                CameraId = detectionDto.CameraId,
                Description = detectionDto.Description,
                Type = detectionDto.Type,
                VideoUrl = detectionDto.VideoUrl,
                SnapShotUrl = "http://localhost:5198/" + detectionDto.SnapshotUrl,
            };

            var New_detection= await _detectionRepository.AddDetectionAsync(detection);



            await _alertNotifier.SendDetectionAlertAsync(MapToDto(New_detection));





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

        public async Task<ApiResponse<DetectionDto>> ResolveDetectionAsync(int id)
        {
            var detection = await _detectionRepository.GetByIdAsync(id);
            if (detection == null)
            {
                return ApiResponse<DetectionDto>.Fail("Detection not found.");
            }

            if (detection.IsResolved)
            {
                return ApiResponse<DetectionDto>.Fail("Detection is already resolved.");
            }

            await _detectionRepository.ResolveDetectionAsync(id);

            var detectionDto = MapToDto(detection);
            detectionDto.IsResolved = true;



            return ApiResponse<DetectionDto>.Success(detectionDto, "Detection resolved successfully.");
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
                SnapShotUrl = detection.SnapShotUrl,
                IsResolved = detection.IsResolved

            };
        }




    }
}
