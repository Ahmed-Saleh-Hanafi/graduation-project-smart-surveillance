using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    public class SensorAlert
    {

        public int Id { get; set; }
        public int SensorId { get; set; }
        public string SensorName { get; set; }
        public double TriggeredValue { get; set; }   // the value that caused it
        public double Threshold { get; set; }         // the threshold at time of alert
        public string Message { get; set; }           // e.g. "Gas level exceeded threshold"
        public bool IsResolved { get; set; } = false;
        public DateTime TriggeredAt { get; set; } = DateTime.UtcNow;
        public Sensor Sensor { get; set; }


    }
}
