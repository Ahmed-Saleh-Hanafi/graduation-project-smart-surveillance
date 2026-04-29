using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    public class CameraPersonList
    {
        public int Id { get; set; }
        public int CameraId { get; set; }
        public int PersonId { get; set; }
        public ListType Type { get; set; }

        public Camera Camera { get; set; }
        public Person Person { get; set; }

    }
}
