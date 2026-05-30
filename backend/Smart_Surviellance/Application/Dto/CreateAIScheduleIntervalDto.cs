using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Dto
{
    public class CreateAIScheduleIntervalDto
    {

        public TimeSpan StartTime { get; set; }
        public TimeSpan EndTime { get; set; }

    }
}
