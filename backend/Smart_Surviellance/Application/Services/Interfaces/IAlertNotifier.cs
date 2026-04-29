using Application.Dto;
using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Services.Interfaces
{
    public interface IAlertNotifier
    {

        Task SendAsync(Alert alert);
        Task SendFaceAlertAsync(FaceAlertDto faceAlertDto);


    }
}
