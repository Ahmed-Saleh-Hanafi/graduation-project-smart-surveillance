using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    public class Detection
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int CameraId { get; set; }
        public DateTime DetectedAt { get; set; }= DateTime.UtcNow;
        public string? SnapShotUrl { get; set; }
        public string Type { get; set; }
        public string Description { get; set; }
        public string? VideoUrl { get; set; }
        public Camera Camera { get; set; }
        
        public bool IsResolved { get; set; } = false;

    }
}
