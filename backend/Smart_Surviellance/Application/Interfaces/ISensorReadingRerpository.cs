using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Interfaces
{
    public interface ISensorReadingRerpository
    {
        Task <IEnumerable<SensorReading>> GetBySensorIdAsync(int sensorId , int take=50);
        Task <SensorReading?> GetLatestByIdAsync(int sensorId);
        Task AddAsync(SensorReading sensorReading);

    }
}
