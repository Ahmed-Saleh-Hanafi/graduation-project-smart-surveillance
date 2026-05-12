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



        [HttpPost]
        public async Task<IActionResult> CreateDetection(CreateDetectionDto detectionDto)
        {
            var response = await _detectionService.CreateDetectionAsync(detectionDto);
            if (response.IsSuccess)
            {
                return Ok(response);
            }
            return BadRequest(response);
        }

        [HttpPost("{detectionId}/resolve")]
        public async Task<IActionResult> ResolveDetection(int detectionId)
        {
            var response = await _detectionService.ResolveDetectionAsync(detectionId);
            if (response.IsSuccess)
            {
                return Ok(response);
            }
            return BadRequest(response);
        }



        //[HttpGet("{detectionId}")]
        //public async Task<IActionResult> GetDetectionById(int detectionId)
        //{
        //    var response = await _detectionService.GetDetectionByIdAsync(detectionId);
        //    if (response.IsSuccess)
        //    {
        //        return Ok(response);
        //    }
        //    return BadRequest(response);
        //}



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
