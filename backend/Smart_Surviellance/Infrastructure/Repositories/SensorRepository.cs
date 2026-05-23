using Application.Interfaces;
using Domain.Entities;
using Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Text;
using Microsoft.EntityFrameworkCore;


namespace Infrastructure.Repositories
{
    public class SensorRepository : ISensorRepository
    {

        private readonly ApplicationDbContext _context;

        public SensorRepository(ApplicationDbContext context)
        {
            _context = context;
        }
        public async Task AddAsync(Sensor sensor)
        {
            await _context.Sensors.AddAsync(sensor);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int sensorId)
        {
            var sensor = await _context.Sensors.FindAsync(sensorId);

            if (sensor != null)
            {
                _context.Sensors.Remove(sensor);
            }
        }

        public async Task<IEnumerable<Sensor>> GetAllAsync()
        {
           return await _context.Sensors.AsNoTracking().ToListAsync();

        }

        public async Task<Sensor?> GetByIdAsync(int sensorId)
        {
            return await _context.Sensors
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == sensorId);
        }

        public async Task UpdateAsync(Sensor sensor)
        {
            _context.Sensors.Update(sensor);
            await _context.SaveChangesAsync();
        }
    }
}
