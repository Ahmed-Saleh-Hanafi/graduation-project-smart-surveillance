using Application.Dto;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Services.Interfaces
{
    public interface ISensorNotifier
    {
        Task SendReadingAsync(SensorReadingDto sensorReadingDto);
        Task SendAlertAsync(SensorAlertDto dto);
    }
}
