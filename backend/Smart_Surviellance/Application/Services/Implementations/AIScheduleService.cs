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
    public class AIScheduleService : IAIScheduleService
    {


        private readonly IAIScheduleRepository _scheduleRepository;
        private readonly ICameraRepository _cameraRepository;


        public AIScheduleService(IAIScheduleRepository scheduleRepository, ICameraRepository cameraRepository)
        {
            _scheduleRepository = scheduleRepository;
            _cameraRepository = cameraRepository;
        }

        private static readonly HashSet<string> AllowedModels =
           new(StringComparer.OrdinalIgnoreCase)
           {
                "face",
                "abnormal",
                "weapon",
           };









        public async Task<ApiResponse<AIScheduleDto>> CreateAsync(CreateAIScheduleDto schedule)
        {
            if (!AllowedModels.Contains(schedule.ModelName))
            {
                return ApiResponse<AIScheduleDto>.Fail($"Model '{schedule.ModelName}' is not allowed. Allowed models are: {string.Join(", ", AllowedModels)}");
            }

            var camera = await _cameraRepository.GetCameraByIdAsync(schedule.cameraId);
            if (camera == null)
            {
                return ApiResponse<AIScheduleDto>.Fail($"Camera with ID {schedule.cameraId} not found.");
            }

            if (schedule.DayOfWeek.HasValue && (schedule.DayOfWeek < 0 || schedule.DayOfWeek > 6))
            {
                return ApiResponse<AIScheduleDto>.Fail("DayOfWeek must be between 0 (Sunday) and 6 (Saturday) or Null for every day.");
            }


            var modelName = schedule.ModelName.ToLower();

            var existingSchedule = await _scheduleRepository.GetExistingScheduleAsync(
                schedule.cameraId,
                modelName,
                schedule.DayOfWeek);

            

            if (existingSchedule != null)
            {
                foreach (var intervalDto in schedule.Intervals)
                {
                    // Prevent duplicate intervals
                    bool alreadyExists = existingSchedule.Intervals.Any(i =>
                        i.StartTime == intervalDto.StartTime &&
                        i.EndTime == intervalDto.EndTime);

                    if (alreadyExists)
                    {
                        continue;
                    }

                    bool overlaps = existingSchedule.Intervals.Any(i => IsOverlapping(i.StartTime, i.EndTime, intervalDto.StartTime, intervalDto.EndTime));

                    if (overlaps)
                        return ApiResponse<AIScheduleDto>.Fail(
                            "Interval overlaps with an existing interval.");

                    existingSchedule.Intervals.Add(new AIScheduleInterval
                    {
                        StartTime = intervalDto.StartTime,
                        EndTime = intervalDto.EndTime
                    });

                }

                await _scheduleRepository.UpdateAsync(existingSchedule);

                return ApiResponse<AIScheduleDto>.Success(
                    MapToDto(existingSchedule, camera),
                    "Interval added to existing schedule.");
            }
            else
            {
                var Schedule = new AISchedule
                {
                    CameraId = schedule.cameraId,
                    ModelName = modelName,
                    DayOfWeek = schedule.DayOfWeek,
                    IsActive = true,
                    Intervals = schedule.Intervals.Select(i => new AIScheduleInterval
                    {
                        StartTime = i.StartTime,
                        EndTime = i.EndTime
                    }).ToList()
                };

                await _scheduleRepository.AddAsync(Schedule);
                    
                return ApiResponse<AIScheduleDto>.Success(
                    MapToDto(Schedule, camera),
                    "Schedule created successfully.");



            }
        }



        public async Task<ApiResponse<bool>> DeleteAsync(int id)
        {
            var existingSchedule = await _scheduleRepository.GetByIdAsync(id);
            if(existingSchedule == null)
            {
                return ApiResponse<bool>.Fail($"Schedule with ID {id} not found.");
            }
            await _scheduleRepository.DeleteAsync(id);
            return ApiResponse<bool>.Success(true, "Schedule deleted successfully.");



        }


        public async Task<ApiResponse<bool>> DeleteIntervalAsync(int scheduleId, int intervalId)
        {
            var schedule = await _scheduleRepository.GetByIdAsync(scheduleId);

            if (schedule == null)
                return ApiResponse<bool>.Fail(
                    $"Schedule with ID {scheduleId} not found.");

            var interval = schedule.Intervals
                .FirstOrDefault(i => i.Id == intervalId);

            if (interval == null)
                return ApiResponse<bool>.Fail(
                    $"Interval with ID {intervalId} not found.");

            bool deletingLastInterval = schedule.Intervals.Count == 1;

            await _scheduleRepository.DeleteIntervalAsync(scheduleId, intervalId);

            return ApiResponse<bool>.Success(
                true,
                deletingLastInterval
                    ? "Last interval deleted. Schedule removed."
                    : "Interval deleted successfully.");
        }


        public async Task<ApiResponse<List<AIScheduleDto>>> GetAllAsync()
        {
            var schedules = await _scheduleRepository.GetAllAsync();
            var result = new List<AIScheduleDto>();
            foreach (var s in schedules)
            {
                var camera = await _cameraRepository.GetCameraByIdAsync(s.CameraId);
                result.Add(MapToDto(s, camera));
            }
            return ApiResponse<List<AIScheduleDto>>.Success(
                result, "Schedules retrieved successfully.");
        }

        public async Task<ApiResponse<List<AIScheduleDto>>> GetByCameraIdAsync(int cameraId)
        {
            var camera = await _cameraRepository.GetCameraByIdAsync(cameraId);
            if(camera == null)
            {
                return ApiResponse<List<AIScheduleDto>>.Fail($"Camera with ID {cameraId} not found.");
            }
            var schedules = await _scheduleRepository.GetByCameraIdAsync(cameraId);
            if (!schedules.Any())
            {
                return ApiResponse<List<AIScheduleDto>>.Success(new List<AIScheduleDto>(), "No schedules found for this camera.");
            }

            var scheduleDtos = schedules.Select(s => MapToDto(s, camera)).ToList();

            return ApiResponse<List<AIScheduleDto>>.Success(scheduleDtos, "Schedules retrieved successfully.");









        }



        public async Task<ApiResponse<bool>> ToggleAsync(int id, bool isActive)
        {
            var existingSchedule = await _scheduleRepository.GetByIdAsync(id);
            if (existingSchedule == null)
            {
                return ApiResponse<bool>.Fail($"Schedule with ID {id} not found.");
            }
            existingSchedule.IsActive = isActive;
            await _scheduleRepository.UpdateAsync(existingSchedule);

            return ApiResponse<bool>.Success(true,"Schedule Active Status Changed Successfully");




        }

        public async Task<ApiResponse<bool>> UpdateAsync(AIScheduleDto schedule)
        {
            // 1. Check schedule exists
            var existingSchedule = await _scheduleRepository.GetByIdAsync(schedule.Id);

            if (existingSchedule == null)
            {
                return ApiResponse<bool>.Fail(
                    $"Schedule with ID {schedule.Id} not found.");
            }

            // 2. Prevent duplicate schedule
            var duplicateSchedule = await _scheduleRepository
                .GetExistingScheduleAsync(
                    schedule.cameraId,
                    schedule.ModelName,
                    schedule.DayOfWeek);

            if (duplicateSchedule != null &&
                duplicateSchedule.Id != schedule.Id)
            {
                return ApiResponse<bool>.Fail(
                    "A schedule already exists for this camera, model, and day.");
            }

            // 3. Validate intervals exist
            if (schedule.Intervals == null || !schedule.Intervals.Any())
            {
                return ApiResponse<bool>.Fail(
                    "Schedule must contain at least one interval.");
            }

            // 4. Validate each interval
            foreach (var interval in schedule.Intervals)
            {
                // Interval existence + ownership validation
                var existingInterval = existingSchedule.Intervals
                    .FirstOrDefault(i => i.Id == interval.Id);

                if (existingInterval == null)
                {
                    return ApiResponse<bool>.Fail(
                        $"Interval with ID {interval.Id} does not belong to this schedule.");
                }

                // Invalid time range
                if (interval.StartTime >= interval.EndTime)
                {
                    return ApiResponse<bool>.Fail(
                        $"Invalid interval ({interval.StartTime} - {interval.EndTime}). Start time must be before end time.");
                }
            }

            // 5. Check overlapping intervals
            var orderedIntervals = schedule.Intervals
                .OrderBy(i => i.StartTime)
                .ToList();

            for (int i = 0; i < orderedIntervals.Count - 1; i++)
            {
                if (orderedIntervals[i].EndTime > orderedIntervals[i + 1].StartTime)
                {
                    return ApiResponse<bool>.Fail(
                        "Intervals cannot overlap.");
                }
            }

            // 6. Update schedule metadata
            existingSchedule.CameraId = schedule.cameraId;
            existingSchedule.ModelName = schedule.ModelName;
            existingSchedule.DayOfWeek = schedule.DayOfWeek;
            existingSchedule.IsActive = schedule.IsActive;

            // 7. Update intervals
            foreach (var intervalDto in schedule.Intervals)
            {
                var interval = existingSchedule.Intervals
                    .First(i => i.Id == intervalDto.Id);

                interval.StartTime = intervalDto.StartTime;
                interval.EndTime = intervalDto.EndTime;
            }

            await _scheduleRepository.UpdateAsync(existingSchedule);

            return ApiResponse<bool>.Success(
                true,
                "Schedule updated successfully.");
        }

















        private static string GetDayLabel(int? dayOfWeek) => dayOfWeek switch
        {
            0 => "Sunday",
            1 => "Monday",
            2 => "Tuesday",
            3 => "Wednesday",
            4 => "Thursday",
            5 => "Friday",
            6 => "Saturday",
            _ => "Every Day"
        };
        private static AIScheduleDto MapToDto(AISchedule s, Camera camera) =>
            new AIScheduleDto
            {
                Id = s.Id,
                cameraId = s.CameraId,
                CameraName = camera?.Name ?? "Unknown",
                ModelName = s.ModelName,
                DayOfWeek = s.DayOfWeek,
                DayOfWeekName = GetDayLabel(s.DayOfWeek),
                IsActive = s.IsActive,
                Intervals = s.Intervals.Select(i => new AIScheduleIntervalDto
                {
                    Id = i.Id,
                    StartTime = i.StartTime,
                    EndTime = i.EndTime
                }).ToList()


            };
        private static bool IsOverlapping(TimeSpan start1,TimeSpan end1,TimeSpan start2,TimeSpan end2)
        {
                return start1 < end2 && start2 < end1;
        }
    }
}

