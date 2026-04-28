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

        Task<Person> GetPersonByIdAsync(int id);

        Task<int?> CreateIDAsync(Person person);

        Task UpdateAsync(Person person);

    }
}
