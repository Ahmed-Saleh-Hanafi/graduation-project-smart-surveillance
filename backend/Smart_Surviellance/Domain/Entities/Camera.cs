using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    public class Camera
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string IpAddress { get; set; }
        public string Port { get; set; }
        public string Username { get; set; }
        public string Password { get; set; }
        public string StreamUrl { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;

    }
}
