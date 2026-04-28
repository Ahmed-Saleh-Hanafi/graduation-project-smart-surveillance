using Application.Dto;
using Application.Interfaces;
using Application.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Smart_Surviellance.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PersonController : ControllerBase
    {

        private readonly IPersonService _personService;

        public PersonController(IPersonService personService)
        {
            _personService = personService;
        }

        //[HttpPost]
        //public async Task<IActionResult> CreatePerson(CreatePersonDto personDto)
        //{
        //    var response = await _personService.CreatePersonAsync(personDto);
        //    if (response.IsSuccess)
        //    {
        //        return Ok(response);
        //    }
        //    return BadRequest(response);
        //}

        [HttpGet]
        public async Task<IActionResult> GetAllPersons()
        {
            var response = await _personService.GetAllAsync();
            if (response.IsSuccess)
            {
                return Ok(response);
            }
            return BadRequest(response);
        }



        }
}
