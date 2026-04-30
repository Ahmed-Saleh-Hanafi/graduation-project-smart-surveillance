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
        private readonly IPersonRepository _personRepository;

        public DetectionService(IDetectionRepository detectionRepository, ICameraRepository cameraRepository, IPersonRepository personRepository)
        {
            _detectionRepository = detectionRepository;
            _cameraRepository = cameraRepository;
            _personRepository = personRepository;
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

        public async Task<ApiResponse<List<DetectionDto>>> GetDetectionsByPersonAndCameraAsync(int personId, int cameraId)
        {
            var person = await _personRepository.GetPersonByIdAsync(personId);

            if (person == null)
            {
                return ApiResponse<List<DetectionDto>>.Fail("Person not found.");
            }
            var camera = await _cameraRepository.GetCameraByIdAsync(cameraId);

            if (camera == null)
            {
                return ApiResponse<List<DetectionDto>>.Fail("Camera not found.");
            }

            var detections = await _detectionRepository.GetByPersonAndCameraAsync(personId, cameraId);

            var result = detections.Select(MapToDto).ToList();

            if(detections == null || !detections.Any())
            {
                return ApiResponse<List<DetectionDto>>.Fail("No detections found for the specified person and camera.");
            }

            return ApiResponse<List<DetectionDto>>.Success(result, "Detections retrieved successfully");
        }

        public async Task<ApiResponse<List<DetectionDto>>> GetDetectionsByPersonAsync(int personId)
        {
            var person = await _personRepository.GetPersonByIdAsync(personId);

            if (person == null)
            {
                return ApiResponse<List<DetectionDto>>.Fail("Person not found.");
            }

            var detections = await _detectionRepository.GetByPersonAsync(personId);

            var result = detections.Select(MapToDto).ToList();

            if (detections == null || !detections.Any())
            {
                return ApiResponse<List<DetectionDto>>.Fail("No detections found for the specified person.");
            }

            return ApiResponse<List<DetectionDto>>.Success(result, "Detections retrieved successfully");
        }




        private DetectionDto MapToDto(Detection detection)
        {
            return new DetectionDto
            {
                Id = detection.Id,
                CameraId = detection.CameraId,
                PersonId = detection.PersonId,
                DetectedAt = detection.DetectedAt,
                Name = detection.Name,
            };
        }




    }
}
