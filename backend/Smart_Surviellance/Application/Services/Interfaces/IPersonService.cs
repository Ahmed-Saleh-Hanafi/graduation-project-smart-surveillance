using Application.Common;
using Application.Dto;
using Application.Interfaces;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Services.Interfaces
{
    public interface IPersonService
    {

        Task<ApiResponse<bool>> CreatePersonAsync(CreatePersonDto personDto);

        Task<ApiResponse<List<PersonDto>>> GetAllAsync();
        



    }
}
