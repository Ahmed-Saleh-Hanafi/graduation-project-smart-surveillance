using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Dto
{
    public class SensorDto
    {

        public int Id { get; set; }
        public string SensorName { get; set; }
        public SensorType sensorType { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsActive { get; set; }
        public double Threshold { get; set; }



    }
}
