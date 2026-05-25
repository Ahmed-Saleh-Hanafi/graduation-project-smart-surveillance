using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Interfaces
{
    public interface IAIScheduleRepository
    {

        Task<AISchedule> GetByIdAsync (int id);
        Task<IEnumerable<AISchedule>> GetAllAsync();
        Task<IEnumerable<AISchedule>> GetByCameraIdAsync(int cameraId);
        Task AddAsync(AISchedule aiSchedule);
        Task UpdateAsync(AISchedule aiSchedule);
        Task DeleteAsync(int id);


        Task<AISchedule> GetExistingScheduleAsync(int cameraId, string modelName, int? dayOfWeek);
        Task DeleteIntervalAsync(int scheduleId, int intervalId);



    }
}
