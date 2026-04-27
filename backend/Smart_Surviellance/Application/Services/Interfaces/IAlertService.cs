using Application.Dto;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Services.Interfaces
{
    public interface IAlertService
    {
        Task CreateAlertAsync(CreateAlertDto createAlertDto);
        Task ResolveAlertAsync(int alertId);

    }
}
