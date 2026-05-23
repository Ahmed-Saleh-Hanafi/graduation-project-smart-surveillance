using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Interfaces
{
    public interface ISensorRepository
    {
        Task<Sensor?> GetByIdAsync(int sensorId);
        Task<IEnumerable<Sensor>> GetAllAsync();
        Task AddAsync(Sensor sensor);
        Task UpdateAsync(Sensor sensor);
        Task DeleteAsync(int sensorId);
    }
}
