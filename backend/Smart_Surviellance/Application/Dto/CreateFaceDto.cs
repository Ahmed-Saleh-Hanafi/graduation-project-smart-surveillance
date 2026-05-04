using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Dto
{
    public class CreateFaceDto
    {

        public int CameraId { get; set; }
        public string Name { get; set; }
        public IFormFile file { get; set; } 
       

    }
}
