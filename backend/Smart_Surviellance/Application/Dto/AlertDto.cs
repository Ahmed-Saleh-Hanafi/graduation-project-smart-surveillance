using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Dto
{
    public class AlertDto
    {
        public int Id { get; set; }
        public int CameraId { get; set; }
        public string Type { get; set; }
        public string Description { get; set; }
        public bool IsResolved { get; set; } = false;
        public DateTime Timestamp { get; set; }
        public DateTime CreatedAt { get; set; }

    }
}
