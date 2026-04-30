using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    public class UserCamera
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public int CameraId { get; set; }


        public User User { get; set; }
        public Camera Camera { get; set; }


    }
}
