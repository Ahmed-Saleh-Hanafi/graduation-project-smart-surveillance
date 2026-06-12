using Application.Dto;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Smart_Surviellance.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AIScheduleController : ControllerBase
    {

        private readonly IAIScheduleService _scheduleService;

        public AIScheduleController(IAIScheduleService scheduleService)
        {
            _scheduleService = scheduleService;
        }


        [HttpPost]
        public async Task<IActionResult> Create(CreateAIScheduleDto schedule)
        {
            var result = await _scheduleService.CreateAsync(schedule);
            if (result.IsSuccess)
                return Ok(result);
            return BadRequest(result);
        }

        [HttpGet("camera/{CameraId}")]
        public async Task<IActionResult> GetByCameraId(int CameraId)
        {
            var result = await _scheduleService.GetByCameraIdAsync(CameraId);
            if (result.IsSuccess)
                return Ok(result);
            return BadRequest(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _scheduleService.GetAllAsync();
            if (result.IsSuccess)
                return Ok(result);
            return BadRequest(result);
        }

        [HttpDelete("Schedule/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _scheduleService.DeleteAsync(id);
            if (result.IsSuccess)
                return Ok(result);
            return BadRequest(result);
        }

        [HttpPut]
        public async Task<IActionResult> Update(AIScheduleDto schedule)
        {
            var result = await _scheduleService.UpdateAsync(schedule);
            if (result.IsSuccess)
                return Ok(result);
            return BadRequest(result);
        }

        [HttpDelete("Interval/{interval}")]
        public async Task<IActionResult> DeleteIntervalAsync(int interval)
        {
            var result = await _scheduleService.DeleteIntervalAsync(interval, interval);
            if (result.IsSuccess)
                return Ok(result);
            return BadRequest(result);
        }

        [HttpPatch("{id}/toggle")]
        public async Task<IActionResult> Toggle(int id, [FromQuery] bool isActive)
        {
            var result = await _scheduleService.ToggleAsync(id, isActive);
            if (result.IsSuccess)
                return Ok(result);
            return BadRequest(result);
        }


    }
}