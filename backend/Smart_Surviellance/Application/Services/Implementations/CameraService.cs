using Application.Common;
using Application.Dto;
using Application.Interfaces;
using Application.Services.Interfaces;
using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;


namespace Application.Services.Implementations
{
    public class CameraService : ICameraService
    {
        private readonly ICameraRepository _cameraRepository;
        private readonly IMediaMTXConfiqService _mediaMTXConfigService;
        private readonly ICurrentUserService _currentUserService;
        private readonly IUserCameraRepository _userCameraRepository;

        public CameraService(ICameraRepository cameraRepository, IMediaMTXConfiqService mediaMTXConfiqService, ICurrentUserService currentUserService, IUserCameraRepository userCameraRepository   )
        {
            _cameraRepository = cameraRepository;
            _mediaMTXConfigService = mediaMTXConfiqService;
            _currentUserService = currentUserService;
            _userCameraRepository = userCameraRepository;
        }


        private async Task<string> BuildRtspUrl(Camera c)
        {
            return $"rtsp://{c.Username}:{c.Password}@{c.IpAddress}:{c.Port}{c.Path}";
            //return $"rtsp://{c.IpAddress}:{c.Port}{c.Path}";
        }




        public async Task<ApiResponse<CameraDto>> CreateAsync(CreateCameraDto createCameraDto)
        {
            var camera = new Camera
            {
                Name = createCameraDto.Name,
                IpAddress = createCameraDto.IpAddress,
                Port = createCameraDto.Port,
                Username = createCameraDto.username,
                Password = createCameraDto.password,
                Path = createCameraDto.Path
            };
            var NewCameraRtspUrl = await BuildRtspUrl(camera);

            var allCameras = await _cameraRepository.GetAllCamerasAsync();

            foreach (var existingCamera in allCameras)
            {
                var existingCameraRtspUrl = await BuildRtspUrl(existingCamera);
                if (existingCameraRtspUrl == NewCameraRtspUrl)
                {
                    return ApiResponse<CameraDto>.Fail("This camera already exists.");
                }
            }


            await _cameraRepository.AddCameraAsync(camera);

            await _mediaMTXConfigService.GenerateConfigAsync();

            return ApiResponse<CameraDto>.Success(new CameraDto
            {
                Id = camera.Id,
                Name = camera.Name,
                IpAddress = camera.IpAddress,
                Port = camera.Port,
                StreamUrl = await  BuildRtspUrl(camera)
            }, "Camera created successfully.");
        }

        public async Task<ApiResponse<bool>> DeleteAsync(int id)
        {
            var camera = await _cameraRepository.GetCameraByIdAsync(id);
            if (camera == null)
            {
                return ApiResponse<bool>.Fail($"Camera with ID {id} not found.");
            }
            await _cameraRepository.DeleteCameraAsync(id);

            await _mediaMTXConfigService.GenerateConfigAsync();

            return ApiResponse<bool>.Success(true, "Camera deleted successfully.");
        }
        
        public async Task<ApiResponse<List<CameraDto>>> GetAllForAiAsync()
        {
            var cameras = await _cameraRepository.GetAllCamerasAsync();
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
            return ApiResponse<List<CameraDto>>.Success(cameraDtos, "Cameras retrieved successfully.");
        }

        public async Task<ApiResponse<List<CameraDto>>> GetAllAsync()
        {
            if (_currentUserService.IsAdmin)
            {


                var cameras = await _cameraRepository.GetAllCamerasAsync();
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
                return ApiResponse<List<CameraDto>>.Success(cameraDtos, "Cameras retrieved successfully.");

            }

            var userId = _currentUserService.UserId;
            var allowedCameras = (await _userCameraRepository.GetCameraIdsByUserIdAsync(userId)).Select(c => c.Id).ToList();

            var usercameras =  await _cameraRepository.GetAllCamerasAsync();
            var filteredCameras = usercameras .Where (c=>allowedCameras.Contains(c.Id))
                                              .Select(async c => new CameraDto
                                              {
                                                  Id = c.Id,
                                                  Name = c.Name,
                                                  IpAddress = c.IpAddress,
                                                  Port = c.Port,
                                                  StreamUrl = await BuildRtspUrl(c)
                                              }).ToList();
            var filteredCamerass = (await Task.WhenAll(filteredCameras)).ToList();

            return ApiResponse<List<CameraDto>>.Success(filteredCamerass, "Cameras retrieved successfully.");






        }

        public async Task<ApiResponse<CameraDto>> GetByIdAsync(int id)
        {

            if (!_currentUserService.IsAdmin)
            {
                var allowedIds = (await _userCameraRepository.GetCameraIdsByUserIdAsync(_currentUserService.UserId)).Select(c => c.Id).ToList();
                if (!allowedIds.Contains(id))
                    return ApiResponse<CameraDto>.Fail("Access denied to this camera.");
            }



            var camera = await _cameraRepository.GetCameraByIdAsync(id);
            if (camera == null)
            {
                return ApiResponse<CameraDto>.Fail($"Camera with ID {id} not found.");
            }

            return ApiResponse<CameraDto>.Success(new CameraDto
            {
                Id = camera.Id,
                Name = camera.Name,
                IpAddress = camera.IpAddress,
                Port = camera.Port,
                StreamUrl = await BuildRtspUrl(camera)
            }, "Camera retrieved successfully.");

        }

        public async Task<ApiResponse<bool>> UpdateAsync(int id, CreateCameraDto updateCameraDto)
        {

            var camera = await _cameraRepository.GetCameraByIdAsync(id);
            if (camera == null)
            {
                return ApiResponse<bool>.Fail($"Camera with ID {id} not found.");
            }

            camera.Name = updateCameraDto.Name;
            camera.IpAddress = updateCameraDto.IpAddress;
            camera.Port = updateCameraDto.Port;
            camera.Username = updateCameraDto.username;
            camera.Password = updateCameraDto.password;
            camera.Path = updateCameraDto.Path;

            await _cameraRepository.UpdateCameraAsync(camera);

            await _mediaMTXConfigService.GenerateConfigAsync();

            return ApiResponse<bool>.Success(true, "Camera updated successfully.");
        }


        public async Task<ApiResponse<WebRTCDto>> GetWebRTCStreamAsync(int id)
        {

            if (!_currentUserService.IsAdmin)
            {
                var allowedIds = (await _userCameraRepository.GetCameraIdsByUserIdAsync(_currentUserService.UserId)).Select(c => c.Id).ToList();
                if (!allowedIds.Contains(id))
                    return ApiResponse<WebRTCDto>.Fail("Access denied to this camera.");
            }


            var camera = await _cameraRepository.GetCameraByIdAsync(id);
            if (camera == null)
            {
                return ApiResponse<WebRTCDto>.Fail($"Camera with ID {id} not found.");
                
            }
            var path = camera.Path.TrimStart('/');
            var url = $"http://localhost:8889/{path}";
            return ApiResponse<WebRTCDto>.Success(new WebRTCDto
            {
                Id = id,
                Name = camera.Name,
                WebRTCUrl = url
            }, "WebRTC stream URL retrieved successfully.");
        }

        public async Task<ApiResponse<GetCameraDto>> GetCameraByIdAsync(int id)
        {
            if (!_currentUserService.IsAdmin)
            {
                var allowedIds = (await _userCameraRepository.GetCameraIdsByUserIdAsync(_currentUserService.UserId)).Select(c => c.Id).ToList();
                if (!allowedIds.Contains(id))
                    return ApiResponse<GetCameraDto>.Fail("Access denied to this camera.");
            }

            var camera = await _cameraRepository.GetCameraByIdAsync(id);
            if (camera == null)
            {
                return ApiResponse<GetCameraDto>.Fail($"Camera with ID {id} not found.");
            }
            return ApiResponse<GetCameraDto>.Success(new GetCameraDto
            {
                Id = camera.Id,
                Name = camera.Name,
                IpAddress = camera.IpAddress,
                Port = camera.Port,
                Path = camera.Path,
                Username = camera.Username,
                Password = camera.Password
            }, "Camera retrieved successfully.");
        }
    }
}
