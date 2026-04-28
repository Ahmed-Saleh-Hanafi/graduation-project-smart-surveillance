using Application.Dto;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Smart_Surviellance.Controllers
{
    [ApiController]
    [Route("api/alerts")]
    public class AlertController : Controller
    {
        private readonly IAlertService _alertService;

        public AlertController(IAlertService alertService)
        {
            _alertService = alertService;
        }

        [HttpPost]
        public async Task<IActionResult> CreateAlert(CreateAlertDto createAlertDto)
        {
            await _alertService.CreateAlertAsync(createAlertDto);
            return Ok();
        }

        [HttpPut("{alertId}/resolve")]
        public async Task<IActionResult> ResolveAlert(int alertId)
        {
            await _alertService.ResolveAlertAsync(alertId);
            return Ok(new { message = "Alert resolved" });
        }

        [HttpGet]
        public async Task<IActionResult> GetAllAlerts()
        {
            var response = await _alertService.GetAllAsync();
            if (response.IsSuccess)
            {
                return Ok(response);
            }
            return BadRequest(response);



        }

    }
}
