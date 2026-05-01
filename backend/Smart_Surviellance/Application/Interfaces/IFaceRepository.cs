using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Interfaces
{
    public interface IFaceRepository
    {

        Task<Face> GetFaceByIdAsync(int id);
        Task CreateFace(Face face);

        Task<List<Face>> GetFacesByCameraIdAsync(int cameraId);
        Task<List<Face>> GetAllFacesAsync();




    }
}
