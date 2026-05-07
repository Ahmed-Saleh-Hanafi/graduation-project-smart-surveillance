using Application.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Text;

namespace Infrastructure.Services
{
    public class VideoService : IVideoService
    {


        private readonly string _videosPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "Videos");

        public async Task<string> SaveVideoAsync(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                throw new ArgumentException("Invalid file");
            }

            // ✅ Validate file type (videos only)
            var allowedExtensions = new[] { ".mp4", ".avi", ".mov", ".mkv" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

            if (!allowedExtensions.Contains(extension))
            {
                throw new ArgumentException("Invalid file type. Only video files are allowed.");
            }

            // ✅ Validate file size (e.g., max 100MB)
            const long maxFileSize = 100 * 1024 * 1024; // 100MB

            if (file.Length > maxFileSize)
            {
                throw new ArgumentException("File size exceeds 100MB limit.");
            }

            // ✅ Ensure directory exists
            if (!Directory.Exists(_videosPath))
            {
                Directory.CreateDirectory(_videosPath);
            }

            // ✅ Generate unique filename
            var fileName = Guid.NewGuid().ToString() + extension;
            var filePath = Path.Combine(_videosPath, fileName);

            // ✅ Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // ✅ Return relative path (for frontend use)
            return Path.Combine("Videos", fileName).Replace("\\", "/");

        }
    }
}
