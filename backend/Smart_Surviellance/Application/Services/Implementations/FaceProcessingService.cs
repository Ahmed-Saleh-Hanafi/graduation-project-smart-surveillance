//(note)
//             return person ID to the ai
//
using Application.Dto;
using Application.Interfaces;
using Application.Services.Implementations;
using Application.Services.Interfaces;
using Domain.Entities;
using Domain.Enums;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Services.Implementations
{
    public class FaceProcessingService : IFaceProcessingService
    {

        private readonly ICameraPersonRepository _cameraPersonRepository;
        private readonly IPersonRepository _personRepository;
        private readonly IDetectionRepository _detectionRepository;

        private readonly IAlertNotifier _alertNotifier;

        public FaceProcessingService(
            ICameraPersonRepository cameraPersonRepository,
            IAlertNotifier alertNotifier,
            IPersonRepository personRepository,
            IDetectionRepository detectionRepository)
        {
            _cameraPersonRepository = cameraPersonRepository;
            _alertNotifier = alertNotifier;
            _personRepository = personRepository;
            _detectionRepository = detectionRepository;
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

                var Person = new Person
                {
                    Name = "Unknown",
                    Url =result.SnapShotUrl
                };

                await _personRepository.CreateAsync(Person);
                await _cameraPersonRepository.AssignAsync(new CameraPersonList
                {
                    CameraId = cameraId,
                    PersonId = Person.Id,
                    Type = ListType.Unknown
                });
                await _detectionRepository.AddDetectionAsync(new Detection
                {
                    CameraId = cameraId,
                    PersonId = Person.Id,
                    SnapShotUrl = result.SnapShotUrl,
                    DetectedAt = DateTime.UtcNow
                });

                // return the new person ID
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


                await _cameraPersonRepository.AssignAsync(new CameraPersonList
                {
                    CameraId = cameraId,
                    PersonId = (int)result.Id,
                    Type = ListType.Unknown
                });
                await _detectionRepository.AddDetectionAsync(new Detection
                {
                    CameraId = cameraId,
                    PersonId = result.Id,
                    SnapShotUrl = result.SnapShotUrl,
                    DetectedAt = DateTime.UtcNow
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

                await _detectionRepository.AddDetectionAsync(new Detection
                {
                    CameraId = cameraId,
                    PersonId = result.Id,
                    SnapShotUrl = result.SnapShotUrl,
                    DetectedAt = DateTime.UtcNow
                });

                return;
            }
            


            return;

        }
    
    
    }
}












