using Application.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.IO;

namespace Smart_Surviellance.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ImageController : ControllerBase
    {
        private readonly IImageService _imageService;

        public ImageController(IImageService imageService)
        {
            _imageService = imageService;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            try
            {
                var imagePath = await _imageService.SaveImageAsync(file);
                var imageUrl = $"{Request.Scheme}://{Request.Host}/Images/{Path.GetFileName(imagePath)}";
                return Ok(new { ImageUrl = imageUrl, ImagePath = imagePath });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Error = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "An error occurred while uploading the image." });
            }
        }
    }
}