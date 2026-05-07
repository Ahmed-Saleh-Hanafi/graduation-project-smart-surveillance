using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Services.Interfaces
{
    public interface IVideoService
    {
        Task<string> SaveVideoAsync(IFormFile file);
    }
}
