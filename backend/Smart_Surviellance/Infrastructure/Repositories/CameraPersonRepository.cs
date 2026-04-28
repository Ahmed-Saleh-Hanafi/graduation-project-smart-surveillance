using Application.Dto;
using Application.Interfaces;
using Domain.Entities;
using Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace Infrastructure.Repositories
{
    public class CameraPersonRepository : ICameraPersonRepository
    {

        private readonly ApplicationDbContext _context;

        public CameraPersonRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task AssignAsync(CameraPersonList cameraPersonList)
        {
            var existing = await _context.CameraPersonLists.FirstOrDefaultAsync(x => x.CameraId == cameraPersonList.CameraId && x.PersonId == cameraPersonList.PersonId);

            if (existing == null)
            {
                await _context.CameraPersonLists.AddAsync(cameraPersonList);
                await _context.SaveChangesAsync();
            }
            else
            {
                throw new InvalidOperationException("This person is already assigned to this camera.");
            }
        }

        public Task<List<Person>> GetByCameraAsync(int cameraId)
        {
            return _context.CameraPersonLists
                .Where(cpl => cpl.CameraId == cameraId)
                .Select(cpl => cpl.Person)
                .ToListAsync();
        }

        public async Task<CameraPersonList> GetCameraPersonAsync(int cameraId, int personId)
        {
            return await _context.CameraPersonLists.FirstOrDefaultAsync(x => x.CameraId == cameraId && x.PersonId == personId);
        }

        public Task UpdateAsync(CameraPersonList cameraPersonList)
        {
            var existing = _context.CameraPersonLists.FirstOrDefault(x => x.CameraId == cameraPersonList.CameraId && x.PersonId == cameraPersonList.PersonId);

            if (existing == null)
            {
                throw new InvalidOperationException("This person is not assigned to this camera.");

            }
            else
            {
                existing.Type = cameraPersonList.Type;
                return _context.SaveChangesAsync();
            }
        }
    }
}
