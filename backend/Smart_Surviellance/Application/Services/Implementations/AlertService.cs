using Application.Dto;
using Application.Interfaces;
using Application.Services.Interfaces;
using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Services.Implementations
{
    public class AlertService : IAlertService
    {
        private readonly IAlertRepository _alertRepository;
        private readonly IAlertNotifier _alertNotifier;

        public AlertService(IAlertRepository alertRepository, IAlertNotifier alertNotifier)
        {
            _alertRepository = alertRepository;
            _alertNotifier = alertNotifier;
        }


        public async Task CreateAlertAsync(CreateAlertDto createAlertDto)
        {
           var alert = new Alert
           {
               CameraId = createAlertDto.CameraId,
               Type = createAlertDto.Type,
               Description = createAlertDto.Description,
               Timestamp = createAlertDto.Timestamp
           };
            await _alertRepository.AddAsync(alert);
            await _alertNotifier.SendAsync(alert);
        }

        public async Task ResolveAlertAsync(int alertId)
        {
            await _alertRepository.MarkAsResolvedAsync(alertId);
        }
    }
}
