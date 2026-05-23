using Application.Dto;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.Text;

namespace Infrastructure.SignalR
{
    public class SensorNotifier : ISensorNotifier
    {

        private readonly IHubContext<AlertHub> _hubContext;
        public SensorNotifier(IHubContext<AlertHub> hubContext)
        {
            _hubContext = hubContext;
        }

        public async Task SendAlertAsync(SensorAlertDto dto)
        {
            var payload = new
            {
                dto.Id,
                dto.SensorId,
                dto.SensorName,
                dto.SensorType,
                dto.TriggeredValue,
                dto.Threshold,
                dto.Message,
                dto.IsResolved,
                dto.TriggeredAt
            };
            // Broadcast to sensor group AND admin group
            await _hubContext.Clients
                .Group($"sensor-{dto.SensorId}")
                .SendAsync("ReceiveSensorAlert", payload);
            await _hubContext.Clients
                .Group("admin")
                .SendAsync("ReceiveSensorAlert", payload);
        }

        public async Task SendReadingAsync(SensorReadingDto dto)
        {
            var payload = new
            {
                dto.Id,
                dto.SensorId,
                dto.SensorName,
                SensorType = dto.SensorType.ToString(),  // send as string not int
                dto.SensorValue,
                dto.Threshold
            };
            // Broadcast to the specific sensor group (all users subscribed to this sensor)
            await _hubContext.Clients
                .Group($"sensor-{dto.SensorId}")
                .SendAsync("ReceiveSensorReading", payload);
            // Also broadcast to admin group (admin sees everything)
            await _hubContext.Clients
                .Group("admin")
                .SendAsync("ReceiveSensorReading", payload);
        }


    }
}
