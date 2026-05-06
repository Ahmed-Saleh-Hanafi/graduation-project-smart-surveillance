using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Interfaces
{
    public interface IDetectionRepository
    {

        Task AddDetectionAsync(Detection detection);
        Task<IEnumerable<Detection>> GetAllDetectionAsync();
        Task<IEnumerable<Detection>> GetByCameraAsync(int cameraId);
        Task<IEnumerable<Detection>> GetByDayAsync(DateTime date);


    }
}
