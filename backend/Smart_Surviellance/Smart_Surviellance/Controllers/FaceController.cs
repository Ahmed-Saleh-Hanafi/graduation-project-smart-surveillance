using Application.Dto;
using Application.Services.Implementations;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Smart_Surviellance.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FaceController : Controller
    {
        private readonly IFaceService _faceService;

        public FaceController(IFaceService faceService)
        {
            _faceService = faceService;
        }

        //[HttpPost("add-face/{cameraId}")]
        //public async Task<IActionResult> AddFace(int cameraId, IFormFile file)
        //{
        //    var response = await _faceService.CreateFaceAsync(cameraId, file);
        //    if (response.IsSuccess)
        //    {
        //        return Ok(response);
        //    }
        //    return BadRequest(response);
        //}


        [HttpPost("add-face")]
        public async Task<IActionResult> AddFace(CreateFaceDto faceDto)
        {
            var response = await _faceService.CreateFaceAsync(faceDto);
            if (response.IsSuccess)
            {
                return Ok(response);
            }
            return BadRequest(response);
        }




        [HttpGet("get-faces/{cameraId}")]
        public async Task<IActionResult> GetFacesByCameraId(int cameraId)
        {

            var response = await _faceService.GetFacesByCameraIdAsync(cameraId);
            if (response.IsSuccess)
            {
                return Ok(response);
            }
            return BadRequest(response);

        }


        [HttpDelete("delete-face/{faceId}")]
        public async Task<IActionResult> DeleteFace(int faceId)
        {
            var response = await _faceService.DeleteFaceAsync(faceId);
            if (response.IsSuccess)
            {
                return Ok(response);
            }
            return BadRequest(response);
        }

        [HttpGet("get-all-faces")]
        public async Task<IActionResult> GetAllFaces()
        {
            var response = await _faceService.GetAllFacesAsync();
            if (response.IsSuccess)
            {
                return Ok(response);
            }
            return BadRequest(response);
        }



    }
}
