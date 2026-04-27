using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Interfaces
{
    public interface IAlertRepository
    {
        Task AddAsync(Alert alert);
        Task<Alert?> GetByIdAsync(int id);
        Task<IEnumerable<Alert>> GetAllAsync();    
        Task<IEnumerable<Alert>> GetByCameraIdAsync(int cameraId);
        Task<IEnumerable<Alert>> GetByTypeAsync(Type type);
        Task MarkAsResolvedAsync(int id);

    }
}
