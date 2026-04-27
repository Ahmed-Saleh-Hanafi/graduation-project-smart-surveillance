using Application.Interfaces;
using Domain.Entities;
using Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Text;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class AlertRepository : IAlertRepository
    {
        private readonly ApplicationDbContext _context;

        public AlertRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(Alert alert)
        {
            await _context.Alerts.AddAsync(alert);
            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<Alert>> GetAllAsync()
        {
            return await _context.Alerts.OrderByDescending(a=>a.CreatedAt).ToListAsync();
        }

        public async Task<IEnumerable<Alert>> GetByCameraIdAsync(int cameraId)
        {
            return await _context.Alerts.Where(a => a.CameraId == cameraId).OrderByDescending(a => a.CreatedAt).ToListAsync();
        }

        public async Task<Alert?> GetByIdAsync(int id)
        {
            return await _context.Alerts.FindAsync(id);
        }

        

        public Task<IEnumerable<Alert>> GetByTypeAsync(string type)
        {
           return _context.Alerts.Where(a => a.Type == type).OrderByDescending(a => a.CreatedAt).ToListAsync().ContinueWith(t => (IEnumerable<Alert>)t.Result);
        }

        public async Task MarkAsResolvedAsync(int id)
        {
            var alert = await _context.Alerts.FindAsync(id);
            if (alert != null)
            {
                alert.IsResolved = true;
                await _context.SaveChangesAsync();
            }
        }
    }
}
