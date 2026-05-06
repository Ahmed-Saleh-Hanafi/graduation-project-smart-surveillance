using Application.Interfaces;
using Domain.Entities;
using Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Text;
using Microsoft.EntityFrameworkCore;


namespace Infrastructure.Repositories
{
    public class FaceRepository : IFaceRepository
    {
        private readonly ApplicationDbContext _context;

        public FaceRepository (ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task CreateFace(Face face)
        {
            await _context.Faces.AddAsync(face);
            await _context.SaveChangesAsync();

        }

        

        public async Task DeleteFaceAsync(int id)
        {
            var face = await _context.Faces.FirstOrDefaultAsync(f => f.Id == id);
            if(face == null)
            {
                throw new Exception($"Face with id {id} not found");
            }
            _context.Faces.Remove(face);
            await _context.SaveChangesAsync();
        }

        public async Task<List<Face>> GetAllFacesAsync()
        {
           return await _context.Faces.ToListAsync();
        }

        public async Task<Face> GetFaceByIdAsync(int id)
        {
            return await _context.Faces.FirstOrDefaultAsync(f => f.Id == id);
        }

        public async Task<List<Face>> GetFacesByCameraIdAsync(int cameraId)
        {
            return await _context.Faces.Where(f => f.CameraId == cameraId).ToListAsync();
        }
        
    }
}
