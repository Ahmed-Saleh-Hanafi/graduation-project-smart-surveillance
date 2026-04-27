using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Dto
{
    public class CreateAlertDto
    {
        public int CameraId { get; set; }
        public string Type { get; set; }
        public string Description { get; set; }
        public DateTime Timestamp { get; set; }



    }
}
