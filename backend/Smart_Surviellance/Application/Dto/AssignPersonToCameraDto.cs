using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Dto
{
    public class AssignPersonToCameraDto
    {
        public int CameraId { get; set; }
        public int PersonId { get; set; }
        public ListType Type { get; set; }
    }
}
