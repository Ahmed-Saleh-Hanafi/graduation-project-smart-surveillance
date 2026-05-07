using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Dto
{
    public class EventRecordedDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string VideoUrl { get; set; }
        public int CameraId { get; set; }
        public DateTime RecordingStart { get; set; }
        public DateTime RecordingEnd { get; set; }
        public DateOnly RecordedAt { get; set; }

    }
}
