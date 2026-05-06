using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Dto
{
    public class CreateDetectionDto
    {
       
        public string Name { get; set; }
        public string Description { get; set; }
        public string Type { get; set; }
        public string? VideoUrl { get; set; }
        public int CameraId { get; set; }
        public IFormFile SnapshotFile { get; set; }


    }
}
