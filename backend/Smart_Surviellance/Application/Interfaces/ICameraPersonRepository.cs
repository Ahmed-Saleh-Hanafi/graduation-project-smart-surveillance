using Application.Dto;
using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Interfaces
{
    public interface ICameraPersonRepository
    {
        Task AssignAsync(CameraPersonList cameraPersonList);
        Task<List<Person>> GetByCameraAsync(int cameraId);
        Task UpdateAsync(CameraPersonList cameraPersonList);
        Task<CameraPersonList> GetCameraPersonAsync(int cameraId , int personId);
    }
}
