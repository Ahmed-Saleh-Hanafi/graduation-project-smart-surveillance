using Application.Dto;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Smart_Surviellance.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EventRecordingController : ControllerBase
    {
        private readonly IEventRecordedService _eventRecordedService;

        public EventRecordingController(IEventRecordedService eventRecordedService)
        {
            _eventRecordedService = eventRecordedService;
        }

        [HttpGet("GetAllEventRecorded")]
        public async Task<IActionResult> GetAllEventRecorded()
        {
            var response = await _eventRecordedService.GetAllEventRecordedAsync();
            if (!response.IsSuccess)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }


        [HttpGet("GetEventRecordedById/{id}")]
        public async Task<IActionResult> GetEventRecordedById(int id)
        {
            var response = await _eventRecordedService.GetEventRecordedByIdAsync(id);
            if (!response.IsSuccess)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }

        [HttpPost("CreateEventRecorded")]
        public async Task<IActionResult> CreateEventRecorded(CreateRecordedEventDto eventDto)
        {
            var response = await _eventRecordedService.CreateEventRecordedAsync(eventDto);
            if (!response.IsSuccess)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }

        [HttpGet("GetByCamera/{cameraId}")]
        public async Task<IActionResult> GetByCamera(int cameraId)
        {
            var response = await _eventRecordedService.GetByCameraAsync(new Domain.Entities.Camera { Id = cameraId });
            if (!response.IsSuccess)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }

        [HttpGet("GetByDate/{date}")]
        public async Task<IActionResult> GetByDate(DateOnly date)
        {
            var response = await _eventRecordedService.GetByDateAsync(date);
            if (!response.IsSuccess)
            {
                return BadRequest(response);
            }
            return Ok(response);
        }



    }
}
