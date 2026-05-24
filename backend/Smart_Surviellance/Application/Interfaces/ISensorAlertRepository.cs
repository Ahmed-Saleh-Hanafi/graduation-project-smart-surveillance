using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Interfaces
{
    public interface ISensorAlertRepository
    {
        Task AddAsync(SensorAlert alert);
        Task<IEnumerable<SensorAlert>> GetAllAsync();
        Task<IEnumerable<SensorAlert>> GetBySensorIdAsync(int sensorId);
        Task<IEnumerable<SensorAlert>> GetUnresolvedAsync();
        Task MarkAsResolvedAsync(int alertId);
        Task<SensorAlert?> GetAlertById(int alertId);

    }
}
