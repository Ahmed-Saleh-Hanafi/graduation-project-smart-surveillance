using Application.Dto;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Smart_Surviellance.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DetectionController : ControllerBase
    {
        private readonly IDetectionService _detectionService;
        private readonly IFaceProcessingService _faceProcessingService;

        public DetectionController(IDetectionService detectionService, IFaceProcessingService faceProcessingService)
        {
            _detectionService = detectionService;
            _faceProcessingService = faceProcessingService;
        }

        [HttpPost("face/{cameraId}")]
        public async Task<IActionResult> ProcessDetectionAsync(int cameraId, [FromBody] FaceResultDto result)
        {
            var response = await _faceProcessingService.HandleDetectionAsync(cameraId, result);
            if (response.IsSuccess)
            {
                return Ok(response);
            }
            return BadRequest(response);
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

       






        }

}
