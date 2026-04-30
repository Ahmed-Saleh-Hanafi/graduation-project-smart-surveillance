using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Dto
{
    public class FaceResultDto
    {
        public int? Id { get; set; }
        public float Confidence { get; set; }
        public string? SnapShotUrl { get; set; }
    }
}
