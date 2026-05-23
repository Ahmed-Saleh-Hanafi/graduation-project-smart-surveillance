using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Dto
{
    public class SensorAlertDto
    {
        public int Id { get; set; }
        public int SensorId { get; set; }
        public string SensorName { get; set; }
        public string SensorType { get; set; }        // "Temperature" / "Motion" / "Gas"
        public double TriggeredValue { get; set; }
        public double Threshold { get; set; }
        public string Message { get; set; }
        public bool IsResolved { get; set; }
        public DateTime TriggeredAt { get; set; }
    }
}
