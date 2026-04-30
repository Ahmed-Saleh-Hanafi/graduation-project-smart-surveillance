using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    public class Detection
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int? PersonId { get; set; }
        public int CameraId { get; set; }
        public DateTime DetectedAt { get; set; }= DateTime.UtcNow;
        public string? SnapShotUrl { get; set; }
        public Camera Camera { get; set; }
        public Person? Person { get; set; } 

    }
}
