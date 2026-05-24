using Application.Dto;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Smart_Surviellance.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SensorController : ControllerBase
    {

        private readonly ISensorService _sensorService;

        public SensorController(ISensorService sensorService)
        {
            _sensorService = sensorService;
        }

        [HttpPost("add")]
        public async Task<IActionResult> AddSensor( CreateSensorDto createSensorDto)
        {
            var result = await _sensorService.AddSensorAsync(createSensorDto);
            if (result.IsSuccess)
            {
                return Ok(result);
            }
            return BadRequest(result);
        }

        [HttpDelete("delete/{SensorId}")]
        public async Task<IActionResult> DeleteSensor(int SensorId)
        {
            var result = await _sensorService.DeleteSensorAsync(SensorId);
            if (result.IsSuccess)
            {
                return Ok(result);
            }
            return BadRequest(result);
        }

        [HttpGet("GetAll")]
        public async Task<IActionResult> GetAllSensors()
        {
            var result = await _sensorService.GetAllSensorsAsync();
            if (result.IsSuccess)
            {
                return Ok(result);
            }
            return BadRequest(result);
        }

        [HttpGet("GetById/{SensorId}")]
        public async Task<IActionResult> GetSensorById(int SensorId)
        {
            var result = await _sensorService.GetSensorByIdAsync(SensorId);
            if (result.IsSuccess)
            {
                return Ok(result);
            }
            return BadRequest(result);
        }

        [HttpPut("update")]
        public async Task<IActionResult> UpdateSensor(SensorDto sensorDto)
        {
            var result = await _sensorService.UpdateSensorAsync(sensorDto);
            if (result.IsSuccess)
            {
                return Ok(result);
            }
            return BadRequest(result);
        }

        [HttpGet("{sensorId}/readings")]
        public async Task<IActionResult> GetSensorReadings(int SensorId)
        {
            var result = await _sensorService.GetSensorReadingsAsync(SensorId);
            if (result.IsSuccess)
            {
                return Ok(result);
            }
            return BadRequest(result);
        }

        [HttpGet("Sensor/alerts")]
        public async Task<IActionResult> GetAllAlerts()
        {
            var result = await _sensorService.GetAllAlertsAsync();
            if (result.IsSuccess)
            {
                return Ok(result);
            }
            return BadRequest(result);
        }

        [HttpGet("Sensor/{id}/alerts")]
        public async Task<IActionResult> GetAlertBySensorId(int id)
        {
            var result = await _sensorService.GetAlertBySensorIdAsync(id);
            if (result.IsSuccess)
            {
                return Ok(result);
            }
            return BadRequest(result);
        }

        [HttpGet("alerts/{alertId}")]
        public async Task<IActionResult> GetAlertById(int alertId)
        {
            var result = await _sensorService.GetAlertByIdAsync(alertId);
            if (result.IsSuccess)
            {
                return Ok(result);
            }
            return BadRequest(result);
        }

        [HttpPut("alerts/{alertId}/resolve")]
        public async Task<IActionResult> MarkAlertAsResolved(int alertId)
        {
            var result = await _sensorService.MarkAlertAsResolvedAsync(alertId);
            if (result.IsSuccess)
            {
                return Ok(result);
            }
            return BadRequest(result);
        }



        }
}