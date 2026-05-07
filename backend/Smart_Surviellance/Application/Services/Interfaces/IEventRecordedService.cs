using Application.Common;
using Application.Dto;
using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Services.Interfaces
{
    public interface IEventRecordedService
    {

        Task<ApiResponse<List<EventRecordedDto>>> GetAllEventRecordedAsync();
        Task<ApiResponse<EventRecordedDto>> GetEventRecordedByIdAsync(int id);
        Task<ApiResponse<EventRecordedDto>> CreateEventRecordedAsync(CreateRecordedEventDto eventDto);
        Task<ApiResponse<List<EventRecordedDto>>> GetByCameraAsync(Camera camera);
        Task<ApiResponse<List<EventRecordedDto>>> GetByDateAsync(DateOnly date);



    }
}
