using Application.Dto;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Smart_Surviellance.Controllers
{
    public class AlertController : Controller
    {
        private readonly IAlertService _alertService;

        public AlertController(IAlertService alertService)
        {
            _alertService = alertService;
        }

        [HttpPost("api/alerts")]
        public async Task<IActionResult> CreateAlert(CreateAlertDto createAlertDto)
        {
            await _alertService.CreateAlertAsync(createAlertDto);
            return Ok();
        }

        [HttpPut("api/alerts/{alertId}/resolve")]
        public async Task<IActionResult> ResolveAlert(int alertId)
        {
            await _alertService.ResolveAlertAsync(alertId);
            return Ok(new { message = "Alert resolved" });
        }




    }
}
