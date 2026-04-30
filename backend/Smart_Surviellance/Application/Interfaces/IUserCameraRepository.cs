using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Interfaces
{
    public interface IUserCameraRepository
    {

        Task AssignUserToCameraAsync(UserCamera userCamera);
        Task <List<UserCamera>> GetAllUserCameraAsync();
        Task RemoveUserToCameraAsync(UserCamera userCamera);
        Task<List<int>> GetCameraIdsByUserIdAsync(string userId);
        Task<UserCamera?> GetAsync(int cameraId, string userId);


    }
}
