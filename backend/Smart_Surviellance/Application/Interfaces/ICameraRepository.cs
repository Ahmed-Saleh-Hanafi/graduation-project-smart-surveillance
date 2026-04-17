using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Interfaces
{
    public interface ICameraRepository
    {
        Task<Camera> GetCameraByIdAsync(int id);
        Task<IEnumerable<Camera>> GetAllCamerasAsync();
        Task AddCameraAsync(Camera camera);
        Task DeleteCameraAsync(int id);
        Task UpdateCameraAsync(Camera camera);
        Task<bool> CameraExistsAsync(int id);
    }
}
