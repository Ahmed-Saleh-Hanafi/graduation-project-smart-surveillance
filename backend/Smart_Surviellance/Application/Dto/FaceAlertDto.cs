using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Dto
{
    public class FaceAlertDto
    {
        public int Id { get; set; }
        public int CameraId { get; set; }
        public int? PersonId { get; set; }
        public float Confidence { get; set; }
        public string? SnapShotUrl { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public String Message { get; set; }
    }
}
