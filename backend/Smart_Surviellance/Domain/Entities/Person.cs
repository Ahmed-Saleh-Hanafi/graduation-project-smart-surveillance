using System;
using System.Collections.Generic;
using System.Text;

namespace Domain.Entities
{
    public class Person
    {

        public int Id { get; set; }
        public string Name { get; set; }
        public string? Url { get; set; }

        public ICollection<CameraPersonList> CameraPersonLists { get; set; }




    }
}
