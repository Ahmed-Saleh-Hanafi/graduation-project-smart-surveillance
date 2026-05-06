using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Dto
{
    public class DetectionDto
    {
        public int? Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string Type { get; set; }
        public string? VideoUrl { get; set; }
        public int CameraId { get; set; }
        public DateTime DetectedAt { get; set; }
        public string? SnapShotUrl { get; set; }
    }
}
