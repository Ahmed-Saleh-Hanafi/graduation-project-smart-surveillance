using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Dto
{
    public class CreateRecordedEventDto
    {
        public string Name { get; set; }
        public int CameraId { get; set; }

        public DateTime RecordingStart { get; set; }
        public DateTime RecordingEnd { get; set; }

        public IFormFile VideoFile { get; set; }






    }
}
