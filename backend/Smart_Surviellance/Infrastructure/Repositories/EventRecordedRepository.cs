using Application.Interfaces;
using Domain.Entities;
using Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Text;
using Microsoft.EntityFrameworkCore;


namespace Infrastructure.Repositories
{
    public class EventRecordedRepository : IEventRecordedRepository
    {
        private readonly ApplicationDbContext _context;

        public EventRecordedRepository(ApplicationDbContext context)
        {
            _context = context;
        }


        public async Task<EventRecorded> CreateEventRecordedAsync(EventRecorded eventRecorded)
        {
            await _context.EventsRecorded.AddAsync(eventRecorded);
            await _context.SaveChangesAsync();
            return eventRecorded;   
        }

        public async Task<List<EventRecorded>> GetAllEventRecordedAsync()
        {
            return await _context.EventsRecorded.ToListAsync();
        }

        public async Task<List<EventRecorded>> GetByCameraAsync(Camera camera)
        {
            return await _context.EventsRecorded.Where(e => e.CameraId == camera.Id).ToListAsync();
        }
        

        public async Task<List<EventRecorded>> GetByDateAsync(DateOnly date)
        {
            return await _context.EventsRecorded.Where(e => e.RecordedAt == date).ToListAsync();
        }

        public async Task<EventRecorded> GetEventRecordedByIdAsync(int id)
        {
            return await _context.EventsRecorded.FirstOrDefaultAsync(e => e.Id == id);
        }
    }
}
