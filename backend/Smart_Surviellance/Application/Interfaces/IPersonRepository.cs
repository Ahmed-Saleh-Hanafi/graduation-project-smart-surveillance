using Application.Dto;
using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Interfaces
{
    public interface IPersonRepository
    {
        Task CreateAsync(Person person);
        Task<List<Person>> GetAllAsync();
    }
}
