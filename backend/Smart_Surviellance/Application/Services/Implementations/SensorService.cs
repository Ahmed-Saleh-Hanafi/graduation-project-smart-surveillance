using Application.Common;
using Application.Dto;
using Application.Interfaces;
using Application.Services.Interfaces;
using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Services.Implementations
{
    public class SensorService : ISensorService
    {

        private readonly ISensorRepository _sensorRepository;
        private readonly ISensorReadingRerpository _sensorReadingRerpository;
        private readonly ISensorNotifier _sensorNotifier;
        private readonly ISensorAlertRepository _sensorAlertRepository;
        public SensorService(ISensorRepository sensorRepository, ISensorReadingRerpository sensorReadingRerpository, ISensorNotifier sensorNotifier, ISensorAlertRepository sensorAlertRepository)
        {
            _sensorRepository = sensorRepository;
            _sensorReadingRerpository = sensorReadingRerpository;
            _sensorNotifier = sensorNotifier;
            _sensorAlertRepository = sensorAlertRepository;
        }


        public async Task<ApiResponse<bool>> AddSensorAsync(CreateSensorDto createSensorDto)
        {
            if (createSensorDto == null)
            {
                return ApiResponse<bool>.Fail("Invalid sensor data.");
            }

            if (string.IsNullOrWhiteSpace(createSensorDto.SensorName))
            {
                return ApiResponse<bool>.Fail("Sensor name is required.");
            }
            if (!Enum.IsDefined(typeof(SensorType), createSensorDto.SensorType))
            {
                return ApiResponse<bool>.Fail("Invalid sensor type.");
            }
            

            var sensor = new Domain.Entities.Sensor
            {
                Name = createSensorDto.SensorName,
                Type = createSensorDto.SensorType,
                Threshold = createSensorDto.Threshold,
            };

            _sensorRepository.AddAsync(sensor);

            return ApiResponse<bool>.Success(true, "Sensor added successfully.");


        }

        public async Task<ApiResponse<bool>> DeleteSensorAsync(int sensorId)
        {
            var sensor = await _sensorRepository.GetByIdAsync(sensorId);
            if (sensor == null)
            {
                return ApiResponse<bool>.Fail("Sensor not found.");
            }

            await _sensorRepository.DeleteAsync(sensorId);

            return ApiResponse<bool>.Success(true, "Sensor deleted successfully.");


        }

        public async Task<ApiResponse<List<SensorDto>>> GetAllSensorsAsync()
        {
            var sensors = await _sensorRepository.GetAllAsync();

            var sensorDtos = sensors.Select(s => new SensorDto
            {
                Id = s.Id,
                SensorName = s.Name,
                sensorType = s.Type,
                CreatedAt = s.CreatedAt,
                IsActive = s.IsActive,
                Threshold = s.Threshold
            }).ToList();

            return ApiResponse<List<SensorDto>>.Success(sensorDtos, "Sensors retrieved successfully.");


        }

        public async Task<ApiResponse<SensorDto>> GetSensorByIdAsync(int sensorId)
        {
            var sensor = await _sensorRepository.GetByIdAsync(sensorId);
            if (sensor == null)
            {
                return ApiResponse<SensorDto>.Fail("Sensor not found.");
            }


            var sensorDto = new SensorDto
            {
                Id = sensor.Id,
                SensorName = sensor.Name,
                sensorType = sensor.Type,
                CreatedAt = sensor.CreatedAt,
                IsActive = sensor.IsActive,
                Threshold = sensor.Threshold
            };

            return ApiResponse<SensorDto>.Success(sensorDto, "Sensor retrieved successfully.");

        }

        public async Task<ApiResponse<List<SensorReadingDto>>> GetSensorReadingsAsync(int sensorId, int take = 50)
        {
            var sensor = await _sensorRepository.GetByIdAsync(sensorId);
            if (sensor == null)
            {
                return ApiResponse<List<SensorReadingDto>>.Fail("Sensor not found.");
            }

            var readings = await _sensorReadingRerpository.GetBySensorIdAsync(sensorId, take);

            var readingDtos = readings.Select(r => new SensorReadingDto
            {
                Id = r.Id,
                SensorId = r.SensorId,
                SensorName = sensor.Name,
                SensorType = sensor.Type,
                SensorValue = r.SensorValue,
                RecordedAt = r.RecordedAt,
                Threshold = sensor.Threshold,
            }).ToList();


            return ApiResponse<List<SensorReadingDto>>.Success(readingDtos, "Sensor readings retrieved successfully.");



        }

        public async Task<ApiResponse<SensorReadingDto>> RecordReadingAsync(int sensorId, double value)
        {
            var sensor = await _sensorRepository.GetByIdAsync(sensorId);
            if (sensor == null)
            {
                return ApiResponse<SensorReadingDto>.Fail("Sensor not found.");
            }

            var reading = new Domain.Entities.SensorReading
            {
                SensorId = sensorId,
                SensorValue = value,
                RecordedAt = DateTime.UtcNow
            };

            await _sensorReadingRerpository.AddAsync(reading);

            var ReadingDto = new SensorReadingDto
            {
                Id = reading.Id,
                SensorId = sensorId,
                SensorName = sensor.Name,
                SensorType = sensor.Type,
                SensorValue = value,
                RecordedAt = reading.RecordedAt,
                Threshold = sensor.Threshold
            };

            await _sensorNotifier.SendReadingAsync(ReadingDto);



            if (value > sensor.Threshold)
            {
                // Build a human-readable message based on sensor type
                var message = sensor.Type switch
                {
                    SensorType.Temperature => $"Temperature alert: {value}°C exceeds threshold of {sensor.Threshold}°C",
                    SensorType.Gas => $"Gas alert: {value} ppm exceeds safe threshold of {sensor.Threshold} ppm",
                    SensorType.Motion => $"Motion detected on sensor: {sensor.Name}",
                    _ => $"Sensor {sensor.Name} value {value} exceeded threshold {sensor.Threshold}"
                };
                // Save alert to DB
                var sensorAlert = new Domain.Entities.SensorAlert
                {
                    SensorId = sensorId,
                    SensorName = sensor.Name,
                    TriggeredValue = value,
                    Threshold = sensor.Threshold,
                    Message = message,
                    TriggeredAt = DateTime.UtcNow
                };
                await _sensorAlertRepository.AddAsync(sensorAlert);
                // Broadcast alert in real-time via SignalR
                var alertDto = new SensorAlertDto
                {
                    Id = sensorAlert.Id,
                    SensorId = sensorId,
                    SensorName = sensor.Name,
                    SensorType = sensor.Type.ToString(),
                    TriggeredValue = value,
                    Threshold = sensor.Threshold,
                    Message = message,
                    IsResolved = false,
                    TriggeredAt = sensorAlert.TriggeredAt
                };
                await _sensorNotifier.SendAlertAsync(alertDto);
            }



            return ApiResponse<SensorReadingDto>.Success(ReadingDto, "Sensor reading recorded successfully.");




        }

        public async Task<ApiResponse<bool>> UpdateSensorAsync(SensorDto sensorDto)
        {
            var sensor = _sensorRepository.GetByIdAsync(sensorDto.Id);
            if(sensor == null)
            {
                return ApiResponse<bool>.Fail("Sensor not found.");
            }

            await _sensorRepository.UpdateAsync(new Domain.Entities.Sensor
            {
                Id = sensorDto.Id,
                Name = sensorDto.SensorName,
                Type = sensorDto.sensorType,
                IsActive = sensorDto.IsActive,
                Threshold = sensorDto.Threshold,
            });

            return ApiResponse<bool>.Success(true, "Sensor updated successfully.");

        }
    }
}
