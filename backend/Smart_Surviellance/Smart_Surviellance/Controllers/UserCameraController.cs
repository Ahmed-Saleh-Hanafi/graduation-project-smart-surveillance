using Application.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Smart_Surviellance.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserCameraController : ControllerBase
    {
        
        private readonly IUserCameraService _userCameraService;


        public UserCameraController(IUserCameraService userCameraService)
        {
            _userCameraService = userCameraService;
        }

        [HttpPost("user/{userId}/camera/{cameraId}")]
        public async Task<IActionResult> AssignUserToCamera(string userId, int cameraId)
        {
            var result = await _userCameraService.AssignUserToCameraAsync(userId, cameraId);
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpDelete("user/{userId}/camera/{cameraId}")]
        public async Task<IActionResult> UnassignUserFromCamera(string userId, int cameraId)
        {
            var result = await _userCameraService.UnassignUserFromCameraAsync(userId, cameraId);
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpGet("user/{userId}/cameras")]
        public async Task<IActionResult> GetUserCameras(string userId)
        {
            var result = await _userCameraService.GetCameraIdsByUserIdAsync(userId);
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }
        
        [HttpGet("user/{userId}/UnassignedCameras")]
        public async Task<IActionResult> GetUnassignedCamerasByUserId(string userId)
        {
            var result = await _userCameraService.GetUnassignedCamerasByUserIdAsync(userId);
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

    }
}
