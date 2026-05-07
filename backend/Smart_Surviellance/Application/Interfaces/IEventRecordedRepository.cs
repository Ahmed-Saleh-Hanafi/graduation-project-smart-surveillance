using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Interfaces
{
    public interface IEventRecordedRepository
    {

        Task<List<EventRecorded>> GetAllEventRecordedAsync();
        Task<EventRecorded> GetEventRecordedByIdAsync(int id);
        Task<EventRecorded> CreateEventRecordedAsync(EventRecorded eventRecorded);
        Task<List<EventRecorded>> GetByCameraAsync(Camera camera);
        Task<List<EventRecorded>> GetByDateAsync(DateOnly date);



    }
}
