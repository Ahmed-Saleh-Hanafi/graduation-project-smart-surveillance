using Application.Interfaces;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace Infrastructure.Repositories
{
    public class UserCameraRepository : IUserCameraRepository
    {
        private readonly ApplicationDbContext _context;

        public UserCameraRepository(ApplicationDbContext context)
        {  _context = context; }

        public async Task AssignUserToCameraAsync(UserCamera userCamera)
        {
            await _context.AddAsync(userCamera);
            await _context.SaveChangesAsync();
        }

        public async Task<List<UserCamera>> GetAllUserCameraAsync()
        {
            return await _context.UserCameras.ToListAsync();
        }

        public async Task<UserCamera?> GetAsync(int cameraId, string userId)
        {
            return await _context.UserCameras.Where(uc => uc.CameraId == cameraId && uc.UserId == userId).FirstOrDefaultAsync();
        }

        public async Task<List<int>> GetCameraIdsByUserIdAsync(string userId)
        {
            return await _context.UserCameras
                .Where(uc => uc.UserId == userId)
                .Select(uc => uc.CameraId)
                .ToListAsync();
        }

        public async Task RemoveUserToCameraAsync(UserCamera userCamera)
        {
            var existing = await _context.UserCameras
        .FirstOrDefaultAsync(uc =>
            uc.UserId == userCamera.UserId &&
            uc.CameraId == userCamera.CameraId);

            if (existing == null)
                return; // or throw exception

            _context.UserCameras.Remove(existing);
            await _context.SaveChangesAsync();
        }
    }
}
