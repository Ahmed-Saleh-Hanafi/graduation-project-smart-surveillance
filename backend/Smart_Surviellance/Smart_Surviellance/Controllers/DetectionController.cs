using Application.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Smart_Surviellance.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DetectionController : ControllerBase
    {
        private readonly IDetectionService _detectionService;

        public DetectionController(IDetectionService detectionService)
        {
            _detectionService = detectionService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllDetections()
        {
            var response = await _detectionService.GetAllDetectionsAsync();
            if (response.IsSuccess)
            {
                return Ok(response);
            }
            return BadRequest(response);
        }

        [HttpGet("camera/{cameraId}")]
        public async Task<IActionResult> GetDetectionsByCamera(int cameraId)
        {
            var response = await _detectionService.GetDetectionsByCameraAsync(cameraId);
            if (response.IsSuccess)
            {
                return Ok(response);
            }
            return BadRequest(response);

        }

        

        [HttpGet("day/{date}")]
        public async Task<IActionResult> GetDetectionsByDayAsync(DateTime date)
        {
            var response = await _detectionService.GetDetectionsByDayAsync(date);
            if (response.IsSuccess)
            {
                return Ok(response);
            }
            return BadRequest(response);
        }
        [HttpGet("CameraPerson/{personId}/{cameraId}")]
        public async Task<IActionResult> GetDetectionsByPersonAndCameraAsync(int personId, int cameraId)
        {
            var response = await _detectionService.GetDetectionsByPersonAndCameraAsync(personId, cameraId);
            if (response.IsSuccess)
            {
                return Ok(response);
            }
            return BadRequest(response);
        }

        [HttpGet("person/{personId}")]
        public async Task<IActionResult> GetDetectionsByPersonAsync(int personId)
        {
            var response = await _detectionService.GetDetectionsByPersonAsync(personId);
            if (response.IsSuccess)
            {
                return Ok(response);
            }
            return BadRequest(response);
        }






        }

}
