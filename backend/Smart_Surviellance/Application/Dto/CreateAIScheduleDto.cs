using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Dto
{
    public class CreateAIScheduleDto
    {

        public int cameraId { get; set; }

        public string ModelName { get; set; }
        public int? DayOfWeek { get; set; }
        public List<AIScheduleIntervalDto> Intervals { get; set; } = new List<AIScheduleIntervalDto>();

    }
}
