using Application.Dto;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Smart_Surviellance.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserManagementController : ControllerBase
    {
        private readonly IUserManagmentService _userManagementService;

        public UserManagementController(IUserManagmentService userManagementService)
        {
            _userManagementService = userManagementService;
        }

        [HttpPost("create-user")]
        public async Task<IActionResult> CreateUser(CreateUserDto createUserDto)
        {
            var result = await _userManagementService.CreateUserAync(createUserDto);
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpGet("get-all-users")]
        public async Task<IActionResult> GetAllUsers()
        {
            var result = await _userManagementService.GetAllUsers();
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpGet("get-user-by-email")]
        public async Task<IActionResult> GetUserByEmail(string email)
        {
            var result = await _userManagementService.GetUserByEmail(email);
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        [HttpGet("get-user-by-id")]
        public async Task<IActionResult> GetUserById(string id)
        {
            var result = await _userManagementService.GetUserById(id);
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

    }
}
