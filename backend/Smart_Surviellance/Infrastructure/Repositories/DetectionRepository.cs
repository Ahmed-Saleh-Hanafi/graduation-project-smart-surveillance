using Application.Interfaces;
using Domain.Entities;
using Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Text;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class DetectionRepository : IDetectionRepository
    {
        public ApplicationDbContext _context;

        public DetectionRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task AddDetectionAsync(Detection detection)
        {
            await _context.Detections.AddAsync(detection);
            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<Detection>> GetAllDetectionAsync()
        {
            return await _context.Detections.ToListAsync();
        }

        public async Task<IEnumerable<Detection>> GetByCameraAsync(int cameraId)
        {
            return await _context.Detections.Where(d => d.CameraId == cameraId).ToListAsync();
        }

        public async Task<IEnumerable<Detection>> GetByDayAsync(DateTime date)
        {
            var start = date.Date;           // 2026-04-28 00:00:00
            var end = start.AddDays(1);     // next day

            return await _context.Detections
                .Where(x => x.DetectedAt >= start && x.DetectedAt < end)
                .ToListAsync();
        }

        public async Task<IEnumerable<Detection>> GetByPersonAndCameraAsync(int personId, int cameraId)
        {
            return await _context.Detections.Where(d => d.PersonId == personId && d.CameraId == cameraId).ToListAsync();
        }

        public async Task<IEnumerable<Detection>> GetByPersonAsync(int personId)
        {
            return await _context.Detections.Where(d => d.PersonId == personId).ToListAsync();
            
        }
    }
}
