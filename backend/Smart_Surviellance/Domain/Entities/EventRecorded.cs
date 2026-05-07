using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    public class EventRecorded
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string VideoUrl { get; set; }        
        public int CameraId { get; set; }
        public DateTime RecordingStart { get; set; }
        public DateTime RecordingEnd { get; set; }
        public DateOnly RecordedAt { get; set; }= DateOnly.FromDateTime(DateTime.Now);
        public Camera camera { get; set; }


        

    }
}
