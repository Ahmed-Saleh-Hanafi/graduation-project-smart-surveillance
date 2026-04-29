using Application.Dto;
using Application.Services.Interfaces;
using Domain.Entities;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.Text;

namespace Infrastructure.SignalR
{
    public class AlertNotifier : IAlertNotifier
    {
        private readonly IHubContext<AlertHub> _hubContext;

        public AlertNotifier(IHubContext<AlertHub> hubContext)
        {
            _hubContext = hubContext;
        }

        public async Task SendAsync(Alert alert)
        {
            await _hubContext.Clients.All.SendAsync("ReceiveAlert", new
            {
                alert.Id,
                alert.CameraId,
                alert.Type,
                alert.Description,
                alert.IsResolved,
                alert.Timestamp,
                alert.CreatedAt
            });
        }

        public async Task SendFaceAlertAsync(FaceAlertDto faceAlertDto)
        {
            await _hubContext.Clients.All.SendAsync("ReceiveFaceAlert", new
            {
                faceAlertDto.Id,
                faceAlertDto.CameraId,
                faceAlertDto.PersonId,
                faceAlertDto.Confidence,
                faceAlertDto.SnapShotUrl,
                faceAlertDto.CreatedAt,
                faceAlertDto.Message
            });
        }
    }
}
