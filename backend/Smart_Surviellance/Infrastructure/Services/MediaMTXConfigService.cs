using Application.Interfaces;
using Application.Services.Interfaces;
using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Infrastructure.Services
{
    public class MediaMTXConfigService : IMediaMTXConfiqService
    {
        private readonly ICameraRepository _cameraRepository;


        private readonly string _configPath;

       

        public MediaMTXConfigService(ICameraRepository cameraRepository)
        {
            _cameraRepository = cameraRepository;

            var baseDir = AppContext.BaseDirectory;
            var rootPath = Path.GetFullPath(Path.Combine(baseDir, ".." ,"..", "..", "..", "..", ".."));

            _configPath = Path.Combine(rootPath, "streaming-service", "mediamtx.yml");
        }

        private string BuildRtspUrl(Camera c)
        {
            return $"rtsp://{c.Username}:{c.Password}@{c.IpAddress}:{c.Port}{c.Path}";
            //return $"rtsp://{c.IpAddress}:{c.Port}{c.Path}";
        }

        public async Task GenerateConfigAsync()
        {
            var cameras = await _cameraRepository.GetAllCamerasAsync();

            var yaml = new StringBuilder();

            yaml.AppendLine("logLevel: debug");
            yaml.AppendLine();
            yaml.AppendLine("rtsp: yes");
            yaml.AppendLine("rtspAddress: :8554");
            yaml.AppendLine();
            yaml.AppendLine("hls: yes");
            yaml.AppendLine("hlsAddress: :8888");
            yaml.AppendLine();
            




            yaml.AppendLine("paths:");



            foreach (var cam in cameras)
            {
                var path = cam.Path.TrimStart('/');

                yaml.AppendLine($"  {path}:");
                yaml.AppendLine($"    source: \"{BuildRtspUrl(cam)}\"");
            }


            await File.WriteAllTextAsync(_configPath, yaml.ToString());


        }
    }
}
