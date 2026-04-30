using Application.Common;
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

        public async Task<ApiResponse<List<int>>> GetCameraIdsByUserIdAsync(string userId)
        {
            if (userId == null)
            {
                return ApiResponse<List<int>>.Fail("User ID cannot be null.");
            }

            var cameraIds = await _userCameraRepository.GetCameraIdsByUserIdAsync(userId);

            return ApiResponse<List<int>>.Success(cameraIds , "Camera IDs retrieved successfully");


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
