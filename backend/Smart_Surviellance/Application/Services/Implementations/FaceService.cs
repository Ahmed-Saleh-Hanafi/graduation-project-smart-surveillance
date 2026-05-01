using Application.Common;
using Application.Dto;
using Application.Interfaces;
using Application.Services.Interfaces;
using Domain.Entities;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Text;
using Application.Common;


namespace Application.Services.Implementations
{
    public class FaceService : IFaceService
    {

        private readonly IImageService _imageService;
        private readonly IFaceRepository _faceRepository;
        private readonly ICameraRepository _cameraRepository;
        private readonly ICurrentUserService _currentUserService;
        private readonly IUserCameraRepository _userCameraRepository;

        public FaceService(IImageService imageService, IFaceRepository faceRepository, ICameraRepository cameraRepository, ICurrentUserService currentUserService, IUserCameraRepository userCameraRepository)
        {
            _imageService = imageService;
            _faceRepository = faceRepository;
            _cameraRepository = cameraRepository;
            _currentUserService = currentUserService;
            _userCameraRepository = userCameraRepository;
        }

        public async Task<ApiResponse<bool>> CreateFaceAsync(int cameraId, IFormFile file)
        {
            try
            {
                var camera = await _cameraRepository.GetCameraByIdAsync(cameraId);
                if (camera == null)
                {
                    return ApiResponse<bool>.Fail("There is no camera with the specified ID.");
                }

                var FileUrl = await _imageService.SaveImageAsync(file);

                 
                var face = new Face
                {
                    CameraId = cameraId,
                    Url = FileUrl,
                    Camera=camera
                };

                await _faceRepository.CreateFace(face);

                return ApiResponse<bool>.Success(true, "Face created successfully.");


            }

            catch (Exception ex) { return ApiResponse<bool>.Fail("An error occurred while creating the face."); }

        }

        public async Task<ApiResponse<bool>> DeleteFaceAsync(int faceId)
        {
            var face = await _faceRepository.GetFaceByIdAsync(faceId);
            if (face == null)
            {
                return ApiResponse<bool>.Fail("There is no face with the specified ID.");
            }

            await _faceRepository.DeleteFaceAsync(faceId);
            return ApiResponse<bool>.Success(true, "Face deleted successfully.");
        }

        public async Task<ApiResponse<List<FaceDto>>> GetAllFacesAsync()
        {
            var faces = await _faceRepository.GetAllFacesAsync();
            var faceDtos = new List<FaceDto>();
            foreach (var face in faces)
            {
                faceDtos.Add(new FaceDto
                {
                    Id = face.Id,
                    CameraId = face.CameraId,
                    Url = face.Url
                });
            }
            return ApiResponse<List<FaceDto>>.Success(faceDtos, "Faces retrieved successfully.");
        }

        public async Task<ApiResponse<List<FaceDto>>> GetFacesByCameraIdAsync(int cameraId)
        {
            try
            {

                if (!_currentUserService.IsAdmin)
                {
                    var allowedIds = await _userCameraRepository.GetCameraIdsByUserIdAsync(_currentUserService.UserId);
                    if (!allowedIds.Contains(cameraId))
                        return ApiResponse<List<FaceDto>>.Fail("Access denied to this camera.");
                }

                var camera = await _cameraRepository.GetCameraByIdAsync(cameraId);
                if (camera == null)
                {
                    return ApiResponse<List<FaceDto>>.Fail("There is no camera with the specified ID.");
                }
                var faces = await _faceRepository.GetFacesByCameraIdAsync(cameraId);
                var faceDtos = new List<FaceDto>();
                foreach (var face in faces)
                {
                    faceDtos.Add(new FaceDto
                    {
                        Id = face.Id,
                        CameraId = face.CameraId,
                        Url = face.Url
                    });
                }
                return ApiResponse<List<FaceDto>>.Success(faceDtos, "Faces retrieved successfully.");
            }
            catch (Exception ex)
            {
                return ApiResponse<List<FaceDto>>.Fail("An error occurred while retrieving faces.");
            }
        }
    }
}
