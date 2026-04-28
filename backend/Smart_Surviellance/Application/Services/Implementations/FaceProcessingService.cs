using Application.Dto;
using Application.Interfaces;
using Application.Services.Implementations;
using Application.Services.Interfaces;
using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Services.Implementations
{
    public class FaceProcessingService : IFaceProcessingService
    {

        private readonly ICameraPersonRepository _cameraPersonRepository;
        private readonly IAlertNotifier _alertNotifier;

        public FaceProcessingService(
            ICameraPersonRepository cameraPersonRepository,
            IAlertNotifier alertNotifier)
        {
            _cameraPersonRepository = cameraPersonRepository;
            _alertNotifier = alertNotifier;
        }   
        public async Task HandleDetectionAsync(int cameraId, FaceResultDto result)
        {
            
            //Unknown Person

            if (result.Id == null)
            {
                await _alertNotifier.SendFaceAlertAsync(new FaceAlertDto
                {
                    CameraId = cameraId,
                    PersonId = result.Id,
                    Confidence = result.Confidence,
                    SnapShotUrl = result.SnapShotUrl,
                    CreatedAt = DateTime.UtcNow,
                    Message = "🚨 Unknown person detected"
                });

                return;

            }

            var existingCameraPerson = await _cameraPersonRepository.GetCameraPersonAsync(cameraId, result.Id.Value);

            if (existingCameraPerson == null)
            {
                await _alertNotifier.SendFaceAlertAsync(new FaceAlertDto
                {
                    CameraId = cameraId,
                    PersonId = result.Id,
                    Confidence = result.Confidence,
                    SnapShotUrl = result.SnapShotUrl,
                    CreatedAt = DateTime.UtcNow,
                    Message = "🚨 Unknown person detected"
                });
                return;
            }

            if (existingCameraPerson.Type == ListType.Blacklist)
            {
                await _alertNotifier.SendFaceAlertAsync(new FaceAlertDto
                {
                    CameraId = cameraId,
                    PersonId = result.Id,
                    Confidence = result.Confidence,
                    SnapShotUrl = result.SnapShotUrl,
                    CreatedAt = DateTime.UtcNow,
                    Message = "🚨 Blacklisted person detected"
                });
                return;
            }
            


            return;

        }
    
    
    }
}












