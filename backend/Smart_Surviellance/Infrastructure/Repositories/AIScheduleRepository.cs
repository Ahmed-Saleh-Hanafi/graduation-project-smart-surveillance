using Application.Interfaces;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace Infrastructure.Repositories
{
    public class AIScheduleRepository : IAIScheduleRepository
    {

        private readonly ApplicationDbContext _context;

        public AIScheduleRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(AISchedule aiSchedule)
        {
            await _context.AISchedules.AddAsync(aiSchedule);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var schedule = await _context.AISchedules
                .Include(s => s.Intervals)
                .FirstOrDefaultAsync(s => s.Id == id);
            if (schedule != null)
            {
                // Remove all intervals first, then the parent
                _context.AIScheduleIntervals.RemoveRange(schedule.Intervals);
                _context.AISchedules.Remove(schedule);
                await _context.SaveChangesAsync();
            }
            ;
        }

        public async Task DeleteIntervalAsync(int scheduleId, int intervalId)
        {
            var schedule = await _context.AISchedules
        .Include(s => s.Intervals)
        .FirstOrDefaultAsync(s => s.Id == scheduleId);

            if (schedule == null)
                return;

            var interval = schedule.Intervals
                .FirstOrDefault(i => i.Id == intervalId);

            if (interval == null)
                return;

            _context.AIScheduleIntervals.Remove(interval);

            // If this was the last interval → delete whole schedule
            if (schedule.Intervals.Count == 1)
            {
                _context.AISchedules.Remove(schedule);
            }

            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<AISchedule>> GetAllAsync()
        {
            return await _context.AISchedules
            .Include(s => s.Intervals)
            .Include(s => s.CameraId)
            .ToListAsync();
        }

        public async Task<IEnumerable<AISchedule>> GetByCameraIdAsync(int cameraId)
        {
            return await _context.AISchedules
           .Include(s => s.Intervals)
           .Include(s => s.Camera)
           .Where(s => s.CameraId == cameraId)
           .ToListAsync();
        }

        public async Task<AISchedule> GetByIdAsync(int id)
        {
            return await _context.AISchedules
            .Include(s => s.Intervals)
            .FirstOrDefaultAsync(s => s.Id == id);
        }

        public async Task<AISchedule> GetExistingScheduleAsync(int cameraId, string modelName, int? dayOfWeek)
        {
            return await _context.AISchedules
            .Include(s => s.Intervals)
            .FirstOrDefaultAsync(s =>
                s.CameraId == cameraId &&
                s.ModelName == modelName &&
                s.DayOfWeek == dayOfWeek);
        }

        public async Task UpdateAsync(AISchedule aiSchedule)
        {
            _context.AISchedules.Update(aiSchedule);
            await _context.SaveChangesAsync();
        }
    }
}
