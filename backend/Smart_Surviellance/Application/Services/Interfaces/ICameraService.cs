using Application.Dto;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Services.Interfaces
{
    public interface ICameraService
    {
        Task CreateAsync    (CreateCameraDto createCameraDto);
        Task <List<CameraDto>> GetAllAsync();
        Task <CameraDto> GetByIdAsync(int id);
        Task UpdateAsync(int id, CreateCameraDto updateCameraDto);
        Task DeleteAsync (int id);


    }
}
