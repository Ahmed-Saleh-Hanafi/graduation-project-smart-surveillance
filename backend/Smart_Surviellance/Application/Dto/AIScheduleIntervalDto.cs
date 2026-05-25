using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Dto
{
    public class AIScheduleIntervalDto
    {

        public int Id { get; set; }
        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }

    }
}
