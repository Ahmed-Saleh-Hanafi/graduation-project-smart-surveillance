using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Dto
{
   public class CreateSensorDto
    {
        public string SensorName { get; set; }
        public SensorType SensorType { get; set; }
        public double Threshold { get; set; }

    }
}
