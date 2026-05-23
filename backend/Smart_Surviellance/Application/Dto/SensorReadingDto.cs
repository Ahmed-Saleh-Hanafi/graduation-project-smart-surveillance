using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Dto
{
    public class SensorReadingDto
    {

        public int Id { get; set; }
        public int SensorId { get; set; }
        public string SensorName { get; set; }
        public SensorType SensorType { get; set; }
        public double SensorValue { get; set; }
        public DateTime RecordedAt { get; set; }
        public double? Threshold { get; set; }

    }
}
