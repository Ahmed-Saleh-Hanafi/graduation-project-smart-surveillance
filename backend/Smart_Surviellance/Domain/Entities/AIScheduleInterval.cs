using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    public class AIScheduleInterval
    {

        public int Id { get; set; }
        public int AIScheduleId { get; set; }
        public AISchedule AISchedule { get; set; }


        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }

    }
}
