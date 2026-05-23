using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    public class Sensor
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public SensorType Type { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public double Threshold { get; set; } 

        public ICollection<SensorReading> SensorReadings { get; set; }
        public ICollection<SensorAlert> SensorAlerts { get; set; }



    }
}
