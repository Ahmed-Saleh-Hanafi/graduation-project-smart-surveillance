using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Dto
{
    public class CameraDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string IpAddress { get; set; }
        public int Port { get; set; }
        public string StreamUrl { get; set; }
        
    }
}
