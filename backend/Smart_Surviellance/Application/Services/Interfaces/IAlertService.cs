using Application.Common;
using Application.Dto;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Services.Interfaces
{
    public interface IAlertService
    {
        Task CreateAlertAsync(CreateAlertDto createAlertDto);
        Task <ApiResponse<bool>> ResolveAlertAsync(int alertId);

        Task <ApiResponse<IEnumerable<AlertDto>>>  GetAllAsync();
    }
}
