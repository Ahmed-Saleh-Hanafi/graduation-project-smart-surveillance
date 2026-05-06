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
    public class UserCameraService : IUserCameraService
    {
        private readonly IUserCameraRepository _userCameraRepository;
        private readonly ICameraRepository _cameraRepository;
        private readonly IUserRepository _userRepository;


        public UserCameraService(IUserCameraRepository userCameraRepository, ICameraRepository cameraRepository, IUserRepository userRepository)
        {
            _userCameraRepository = userCameraRepository;
            _cameraRepository = cameraRepository;
            _userRepository = userRepository;
        }

        private async Task<string> BuildRtspUrl(Camera c)
        {
            //return $"rtsp://{c.Username}:{c.Password}@{c.IpAddress}:{c.Port}{c.Path}";
            return $"rtsp://{c.IpAddress}:{c.Port}{c.Path}";
        }



        public async Task<ApiResponse<bool>> AssignUserToCameraAsync(string userId, int cameraId)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            var camera = await _cameraRepository.GetCameraByIdAsync(cameraId);

            if (user == null)
            {
                return ApiResponse<bool>.Fail($"User with ID {userId} not found.");
            }

            if (camera == null)
            {
                return ApiResponse<bool>.Fail($"Camera with ID {cameraId} not found.");
            }

            if(await _userCameraRepository.AssignationIsExist(userId, cameraId))
            {
                return ApiResponse<bool>.Fail($"User with ID {userId} is already assigned to camera with ID {cameraId}.");
            }


            var userCamera = new UserCamera
            {
                UserId = userId,
                CameraId = cameraId
            };

            await _userCameraRepository.AssignUserToCameraAsync(userCamera);

            return ApiResponse<bool>.Success(true, "The user is assigned succesfully to this camera");




        }

        public async Task<ApiResponse<List<CameraDto>>> GetCameraIdsByUserIdAsync(string userId)
        {
            if (userId == null)
            {
                return ApiResponse<List<CameraDto>>.Fail("User ID cannot be null.");
            }

            var cameras = await _userCameraRepository.GetCameraIdsByUserIdAsync(userId);

            var cameraDtos = new List<CameraDto>();
            foreach (var camera in cameras)
            {
                cameraDtos.Add(new CameraDto
                {
                    Id = camera.Id,
                    Name = camera.Name,
                    IpAddress = camera.IpAddress,
                    Port = camera.Port,
                    StreamUrl = await BuildRtspUrl(camera)
                });
            }

            return ApiResponse<List<CameraDto>>.Success(cameraDtos, "Camera IDs retrieved successfully");


        }

        public async Task<ApiResponse<List<CameraDto>>> GetUnassignedCamerasByUserIdAsync(string userId)
        {
            if (userId == null)
            {
                return ApiResponse<List<CameraDto>>.Fail("User ID cannot be null.");
            }

            var cameras = await _cameraRepository.GetAllCamerasAsync();
            var unassignedCameras = new List<CameraDto>();
            foreach (var camera in cameras)
            {
                var isAssigned = await _userCameraRepository.GetAsync(camera.Id, userId );
                if (isAssigned == null)
                {
                    unassignedCameras.Add(new CameraDto
                    {
                        Id = camera.Id,
                        Name = camera.Name,
                        IpAddress = camera.IpAddress,
                        Port = camera.Port,
                        StreamUrl = await BuildRtspUrl(camera)  
                    });
                }
            }
            return ApiResponse<List<CameraDto>>.Success(unassignedCameras, "Unassigned cameras retrieved successfully");
        }
           

        public async Task<ApiResponse<bool>> UnassignUserFromCameraAsync(string userId, int cameraId)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            var camera = await _cameraRepository.GetCameraByIdAsync(cameraId);

            if (user == null)
            {
                return ApiResponse<bool>.Fail($"User with ID {userId} not found.");
            }

            if (camera == null)
            {
                return ApiResponse<bool>.Fail($"Camera with ID {cameraId} not found.");

            }


            var userCamera1 = await _userCameraRepository.GetAsync(cameraId, userId);

            if (userCamera1 == null)
            {
                return ApiResponse<bool>.Fail($"User with ID {userId} is not assigned to camera with ID {cameraId}.");
            }


            var userCamera = new UserCamera
            {
                UserId = userId,
                CameraId = cameraId
            };

            await _userCameraRepository.RemoveUserToCameraAsync(userCamera);

            return ApiResponse<bool>.Success(true, "User successfully unassigned from camera.");


        }






    }
}
