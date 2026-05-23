using Application.Interfaces;
using Domain.Entities;
using Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Text;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class SensorReadingRepository : ISensorReadingRerpository
    {

        private readonly ApplicationDbContext _context;
        public SensorReadingRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(SensorReading sensorReading)
        {
            await _context.AddAsync(sensorReading);
            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<SensorReading>> GetBySensorIdAsync(int sensorId, int take = 50)
        {
            return await _context.SensorReadings
                .Where(r => r.SensorId == sensorId)
                .OrderByDescending(r => r.RecordedAt)
                .Take(take)
                .ToListAsync();
        }

        public async Task<SensorReading?> GetLatestByIdAsync(int sensorId)
        {
            return await _context.SensorReadings
                .Where(r => r.SensorId == sensorId)
                .OrderByDescending(r => r.RecordedAt)
                .FirstOrDefaultAsync();
        }
    }
}
