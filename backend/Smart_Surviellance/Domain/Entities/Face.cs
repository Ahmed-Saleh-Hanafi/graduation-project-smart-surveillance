using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    public class Face
    {
        public int Id { get; set; }

        public string Name { get; set; }
        public string Url { get; set; }
        public int CameraId { get; set; }

        public Camera Camera { get; set; }


    }
}
