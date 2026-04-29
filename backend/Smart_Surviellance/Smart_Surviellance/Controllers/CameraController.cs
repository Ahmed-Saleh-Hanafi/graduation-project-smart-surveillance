using Application.Dto;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Smart_Surviellance.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CameraController : ControllerBase
    {
        
        private readonly ICameraService _cameraService;

        public CameraController(ICameraService cameraService)
        {
            _cameraService = cameraService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateCamera([FromBody] CreateCameraDto createCameraDto)
        {
            var result = await _cameraService.CreateAsync(createCameraDto);
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllCameras()
        {
            var result = await _cameraService.GetAllAsync();
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCameraById(int id)
        {
            var result = await _cameraService.GetByIdAsync(id);
            if (!result.IsSuccess)
            {
                return NotFound(result);
            }
            return Ok(result);
        }


        [HttpGet("byid/{id}")]
        public async Task<IActionResult> GetCameraByIdAsync(int id)
        {
            var result = await _cameraService.GetCameraByIdAsync(id);
            if (!result.IsSuccess)
            {
                return NotFound(result);
            }
            return Ok(result);
        }



        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCamera(int id, [FromBody] CreateCameraDto updateCameraDto)
        {
            var result = await _cameraService.UpdateAsync(id, updateCameraDto);
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCamera(int id)
        {
            var result = await _cameraService.DeleteAsync(id);
            if (!result.IsSuccess)
            {
                return NotFound(result);
            }
            return Ok(result);
        }




        [HttpGet("{id}/webrtc")]
        public async Task<IActionResult> GetWebRTCStream(int id)
        {
            var result = await _cameraService.GetWebRTCStreamAsync(id);
            if (!result.IsSuccess)
            {
                return NotFound(result);
            }
            return Ok(result);

        }


    }
}
