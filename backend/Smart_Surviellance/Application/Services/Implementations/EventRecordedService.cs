using Application.Common;
using Application.Dto;
using Application.Interfaces;
using Application.Services.Interfaces;
using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;
using System.Linq; // <-- added

namespace Application.Services.Implementations
{
    public class EventRecordedService : IEventRecordedService
    {

        private readonly IEventRecordedRepository _eventRepository;
        private readonly ICameraRepository _cameraRepository;
        private readonly IVideoService _videoService;


        public EventRecordedService(IEventRecordedRepository eventRepository, ICameraRepository cameraRepository, IVideoService videoService)
        {
            this._eventRepository = eventRepository;
            this._cameraRepository = cameraRepository;
            this._videoService = videoService;
        }

        public async Task<ApiResponse<EventRecordedDto>> CreateEventRecordedAsync(CreateRecordedEventDto eventDto)
        {
            var Camera = await _cameraRepository.GetCameraByIdAsync(eventDto.CameraId);
            if (Camera == null) 
            {
                return ApiResponse<EventRecordedDto>.Fail("Camera not found");
            }
            if(eventDto.VideoFile== null || eventDto.VideoFile.Length == 0)
            {
                return ApiResponse<EventRecordedDto>.Fail("Video file is required");
            }

            var videoUrl = await _videoService.SaveVideoAsync(eventDto.VideoFile);

            var eventRecorded = new EventRecorded
            {
                Name = eventDto.Name,
                VideoUrl = videoUrl,
                CameraId = eventDto.CameraId,
                RecordingStart = eventDto.RecordingStart,
                RecordingEnd = eventDto.RecordingEnd,
                RecordedAt = DateOnly.FromDateTime(DateTime.Now)
            };

            await _eventRepository.CreateEventRecordedAsync(eventRecorded);
            return ApiResponse<EventRecordedDto>.Success(new EventRecordedDto
            {
                Id = eventRecorded.Id,
                Name = eventRecorded.Name,
                VideoUrl = eventRecorded.VideoUrl,
                CameraId = eventRecorded.CameraId,
                RecordingStart = eventRecorded.RecordingStart,
                RecordingEnd = eventRecorded.RecordingEnd,
                RecordedAt = eventRecorded.RecordedAt
            }, "Event have been recorded successfully");

        }

        public async Task<ApiResponse<List<EventRecordedDto>>> GetAllEventRecordedAsync()
        {
            var events = await _eventRepository.GetAllEventRecordedAsync();
            if (events == null)
            {
                return ApiResponse<List<EventRecordedDto>>.Fail("No events found");
            }

            var eventDtos = events.Select(e => new EventRecordedDto
            {
                Id = e.Id,
                Name = e.Name,
                VideoUrl = e.VideoUrl,
                CameraId = e.CameraId,
                RecordingStart = e.RecordingStart,
                RecordingEnd = e.RecordingEnd,
                RecordedAt = e.RecordedAt
            }).ToList();

            return ApiResponse<List<EventRecordedDto>>.Success(eventDtos, "Events retrieved successfully");
        }

        public async Task<ApiResponse<List<EventRecordedDto>>> GetByCameraAsync(Camera camera)
        {
            var events = await _eventRepository.GetByCameraAsync(camera);
            if (events == null)
            {
                return ApiResponse<List<EventRecordedDto>>.Fail("No events found for the specified camera");
            }

            var eventDtos = events.Select(e => new EventRecordedDto
            {
                Id = e.Id,
                Name = e.Name,
                VideoUrl = e.VideoUrl,
                CameraId = e.CameraId,
                RecordingStart = e.RecordingStart,
                RecordingEnd = e.RecordingEnd,
                RecordedAt = e.RecordedAt
            }).ToList();

            return ApiResponse<List<EventRecordedDto>>.Success(eventDtos, "Events retrieved successfully");
        }

        public async Task<ApiResponse<List<EventRecordedDto>>> GetByDateAsync(DateOnly date)
        {
            var events = await _eventRepository.GetByDateAsync(date);
            if (events == null)
            {
                return ApiResponse<List<EventRecordedDto>>.Fail("No events found for the specified date");
            }

            var eventDtos = events.Select(e => new EventRecordedDto
            {
                Id = e.Id,
                Name = e.Name,
                VideoUrl = e.VideoUrl,
                CameraId = e.CameraId,
                RecordingStart = e.RecordingStart,
                RecordingEnd = e.RecordingEnd,
                RecordedAt = e.RecordedAt
            }).ToList();

            return ApiResponse<List<EventRecordedDto>>.Success(eventDtos, "Events retrieved successfully");
        }

        public async Task<ApiResponse<EventRecordedDto>> GetEventRecordedByIdAsync(int id)
        {
            var eventRecorded = await _eventRepository.GetEventRecordedByIdAsync(id);
            if (eventRecorded == null)
            {
                return ApiResponse<EventRecordedDto>.Fail("Event not found");
            }

            return ApiResponse<EventRecordedDto>.Success(new EventRecordedDto
            {
                Id = eventRecorded.Id,
                Name = eventRecorded.Name,
                VideoUrl = eventRecorded.VideoUrl,
                CameraId = eventRecorded.CameraId,
                RecordingStart = eventRecorded.RecordingStart,
                RecordingEnd = eventRecorded.RecordingEnd,
                RecordedAt = eventRecorded.RecordedAt
            }, "Event retrieved successfully");
        }
    }
}
