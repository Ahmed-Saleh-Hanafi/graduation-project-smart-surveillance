using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    public class Detection
    {
        public int id { get; set; }
        public string name { get; set; }
        public int? PersonId { get; set; }
        public DateTime DetectedAt { get; set; }
        public string? SnapShotUrl { get; set; }
        public Camera Camera { get; set; }
        public Person? Person { get; set; } 

    }
}
