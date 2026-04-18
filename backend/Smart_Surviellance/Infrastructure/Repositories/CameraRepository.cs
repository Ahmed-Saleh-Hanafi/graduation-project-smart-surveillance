using Application.Interfaces;
using Domain.Entities;
using Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Text;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories
{
    public class CameraRepository : ICameraRepository
    {
        public readonly ApplicationDbContext _context;

        public CameraRepository(ApplicationDbContext context)
        {
            _context = context;
        }
        public async Task AddCameraAsync(Camera camera)
        {
            await _context.Cameras.AddAsync(camera);
            
            
        }

        public Task<bool> CameraExistsAsync(int id)
        {
           return _context.Cameras.AnyAsync(c => c.Id == id);
        }

        public async Task DeleteCameraAsync(int id)
        {
            var camera = await _context.Cameras.FindAsync(id);
            if (camera != null)
            {
                _context.Cameras.Remove(camera);
            }
        }

        public async Task<IEnumerable<Camera>> GetAllCamerasAsync()
        {
            return await _context.Cameras.ToListAsync();
        }

        public async Task<Camera> GetCameraByIdAsync(int id)
        {
            return await _context.Cameras.FindAsync(id);
        }

        public Task UpdateCameraAsync(Camera camera)
        {
            _context.Cameras.Update(camera);
            return Task.CompletedTask;
        }
    }
}
