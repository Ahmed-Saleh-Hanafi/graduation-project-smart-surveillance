using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text;

namespace Domain.Entities
{
    public class SensorReading
    {
        public int Id { get; set; }
        public int SensorId { get; set; }
        public double SensorValue { get; set; }
        public DateTime RecordedAt { get; set; } = DateTime.Now;

        public Sensor Sensor { get; set; }

    }
}
