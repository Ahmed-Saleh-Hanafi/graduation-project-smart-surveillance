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
    public class CameraService : ICameraService
    {
        private readonly ICameraRepository _cameraRepository;

        public CameraService(ICameraRepository cameraRepository)
        {
            _cameraRepository = cameraRepository;
        }


        private string BuildRtspUrl(Camera c)
        {
            //return $"rtsp://{c.Username}:{c.Password}@{c.IpAddress}:{c.Port}{c.Path}";
            return $"rtsp://{c.IpAddress}:{c.Port}{c.Path}";
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
            await _cameraRepository.AddCameraAsync(camera);
            return ApiResponse<CameraDto>.Success(new CameraDto
            {
                Id = camera.Id,
                Name = camera.Name,
                IpAddress = camera.IpAddress,
                Port = camera.Port,
                StreamUrl = BuildRtspUrl(camera)
            }, "Camera created successfully.");
        }

        public async Task<ApiResponse<bool>> DeleteAsync(int id)
        {
            var camera = await _cameraRepository.GetCameraByIdAsync(id);
            if (camera == null)
            {
                throw new Exception($"Camera with ID {id} not found.");
            }
            await _cameraRepository.DeleteCameraAsync(id);

            return ApiResponse<bool>.Success(true, "Camera deleted successfully.");
        }
        
        

        public async Task<ApiResponse<List<CameraDto>>> GetAllAsync()
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
                    StreamUrl = BuildRtspUrl(camera)
                });
            }
            return ApiResponse<List<CameraDto>>.Success(cameraDtos, "Cameras retrieved successfully.");

        }

        public async Task<ApiResponse<CameraDto>> GetByIdAsync(int id)
        {
            var camera = await _cameraRepository.GetCameraByIdAsync(id);
            if (camera == null)
            {
                throw new Exception($"Camera with ID {id} not found.");
            }
            return ApiResponse<CameraDto>.Success(new CameraDto
            {
                Id = camera.Id,
                Name = camera.Name,
                IpAddress = camera.IpAddress,
                Port = camera.Port,
                StreamUrl = BuildRtspUrl(camera)
            }, "Camera retrieved successfully.");

        }

        public async Task<ApiResponse<bool>> UpdateAsync(int id, CreateCameraDto updateCameraDto)
        {
            var camera = await _cameraRepository.GetCameraByIdAsync(id);
            if (camera == null)
            {
                throw new Exception($"Camera with ID {id} not found.");
            }

            camera.Name = updateCameraDto.Name;
            camera.IpAddress = updateCameraDto.IpAddress;
            camera.Port = updateCameraDto.Port;
            camera.Username = updateCameraDto.username;
            camera.Password = updateCameraDto.password;
            camera.Path = updateCameraDto.Path;

            await _cameraRepository.UpdateCameraAsync(camera);
            return ApiResponse<bool>.Success(true, "Camera updated successfully.");
        }
    }
}
