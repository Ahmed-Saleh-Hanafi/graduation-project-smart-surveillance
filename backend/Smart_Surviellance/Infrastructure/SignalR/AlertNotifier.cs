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
            var payload = new
            {
                alert.Id,
                alert.CameraId,
                alert.Type,
                alert.Description,
                alert.IsResolved,
                alert.Timestamp,
                alert.CreatedAt
            };

            // Send to the camera-specific group (regular users) AND the admin group
            await _hubContext.Clients.Group($"camera-{alert.CameraId}").SendAsync("ReceiveAlert", payload);
            await _hubContext.Clients.Group("admin").SendAsync("ReceiveAlert", payload);
        }

        public async Task SendFaceAlertAsync(FaceAlertDto faceAlertDto)
        {
            var payload = new
            {
                faceAlertDto.Id,
                faceAlertDto.CameraId,
                faceAlertDto.PersonId,
                faceAlertDto.Confidence,
                faceAlertDto.SnapShotUrl,
                faceAlertDto.CreatedAt,
                faceAlertDto.Message
            };

            // Send to the camera-specific group (regular users) AND the admin group
            await _hubContext.Clients.Group($"camera-{faceAlertDto.CameraId}").SendAsync("ReceiveFaceAlert", payload);
            await _hubContext.Clients.Group("admin").SendAsync("ReceiveFaceAlert", payload);
        }
    }
}

