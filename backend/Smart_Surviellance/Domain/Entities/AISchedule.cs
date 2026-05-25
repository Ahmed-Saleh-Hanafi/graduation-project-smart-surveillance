using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    public class AISchedule
    {
        public int Id { get; set; }
        public int CameraId { get; set; }
        public Camera Camera { get; set; }
        public string ModelName { get; set; }
        public int? DayOfWeek { get; set; } // 0-6 for Sunday-Saturday, null for every day
        
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }= DateTime.Now;

        public ICollection<AIScheduleInterval> Intervals { get; set; } = new List<AIScheduleInterval>();





    }
}
