using Application.Common;
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
        private readonly ICurrentUserService _currentUserService;
        private readonly IUserCameraRepository _userCameraRepository;   

        public AlertService(IAlertRepository alertRepository, IAlertNotifier alertNotifier, ICurrentUserService currentUserService, IUserCameraRepository userCameraRepository)
        {
            _alertRepository = alertRepository;
            _alertNotifier = alertNotifier;
            _currentUserService = currentUserService;
            _userCameraRepository = userCameraRepository;
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

        public async Task<ApiResponse<IEnumerable<AlertDto>>> GetAllAsync()
        {


            var alerts = await _alertRepository.GetAllAsync();

            if (alerts == null)
            {
                return ApiResponse<IEnumerable<AlertDto>>.Fail("No alerts found");
            }

            if (!_currentUserService.IsAdmin)
            {
                var allowedCameraIds = await _userCameraRepository
                    .GetCameraIdsByUserIdAsync(_currentUserService.UserId);
                alerts = alerts.Where(a => allowedCameraIds.Contains(a.CameraId));
            }


            var alertDtos = alerts.Select(alert => new AlertDto
            {
                Id = alert.Id,
                CameraId = alert.CameraId,
                Type = alert.Type,
                Description = alert.Description,
                IsResolved = alert.IsResolved,
                Timestamp = alert.Timestamp,
                CreatedAt = alert.CreatedAt
            });

            

            return ApiResponse<IEnumerable<AlertDto>>.Success(alertDtos, "All alerts retrieved successfully");
        }

        public async Task<ApiResponse<bool>> ResolveAlertAsync(int alertId)
        {
            await _alertRepository.MarkAsResolvedAsync(alertId);

            var alert = await _alertRepository.GetByIdAsync(alertId);
            if (alert != null)
            {
                await _alertNotifier.SendAsync(alert);
                return ApiResponse<bool>.Success(true, "Alert resolved successfully");
            }

            return ApiResponse<bool>.Fail("Alert not found");
        }



    }
}
    

