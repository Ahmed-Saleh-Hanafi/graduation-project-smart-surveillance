using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Dto
{
    public class GetCameraDto
    {
        public int Id { get; set; }
        public string Name { get; set; }

        public string IpAddress { get; set; }
        public int Port { get; set; }

        public string Username { get; set; }
        public string Password { get; set; }

        public string Path { get; set; }

    }
}
