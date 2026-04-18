using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Dto
{
    public class CreateCameraDto
    {
        
        public string Name { get; set; }
        public string IpAddress { get; set; }
        public int Port { get; set; }
        public string username { get; set; }
        public string password { get; set; }
        public string Path { get; set; }

    }
}
