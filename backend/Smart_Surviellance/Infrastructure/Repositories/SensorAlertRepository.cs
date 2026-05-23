using Application.Interfaces;
using Domain.Entities;
using Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Text;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class SensorAlertRepository : ISensorAlertRepository
    {
        private readonly ApplicationDbContext _context;
        public SensorAlertRepository(ApplicationDbContext context)
            => _context = context;
        public async Task AddAsync(SensorAlert alert)
        {
            await _context.SensorAlerts.AddAsync(alert);
            await _context.SaveChangesAsync();
        }
        public async Task<IEnumerable<SensorAlert>> GetAllAsync()
            => await _context.SensorAlerts
                .OrderByDescending(a => a.TriggeredAt)
                .ToListAsync();
        public async Task<IEnumerable<SensorAlert>> GetBySensorIdAsync(int sensorId)
            => await _context.SensorAlerts
                .Where(a => a.SensorId == sensorId)
                .OrderByDescending(a => a.TriggeredAt)
                .ToListAsync();
        public async Task<IEnumerable<SensorAlert>> GetUnresolvedAsync()
            => await _context.SensorAlerts
                .Where(a => !a.IsResolved)
                .OrderByDescending(a => a.TriggeredAt)
                .ToListAsync();
        public async Task MarkAsResolvedAsync(int alertId)
        {
            var alert = await _context.SensorAlerts.FindAsync(alertId);
            if (alert != null)
            {
                alert.IsResolved = true;
                await _context.SaveChangesAsync();
            }
        }

    }
}
