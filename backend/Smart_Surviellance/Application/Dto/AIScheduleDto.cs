using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Dto
{
    public class AIScheduleDto
    {

        public int Id { get; set; }
        public int cameraId { get; set; }
        public string CameraName { get; set; }
        public string ModelName { get; set; }
        public int? DayOfWeek { get; set; }
        public string DayOfWeekName { get; set; }
        public List<AIScheduleIntervalDto> Intervals { get; set; } = new List<AIScheduleIntervalDto>();
        public bool IsActive { get; set; }

    }
}
