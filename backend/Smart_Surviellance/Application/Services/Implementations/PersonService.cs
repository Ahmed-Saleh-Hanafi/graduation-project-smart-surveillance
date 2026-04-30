using Application.Common;
using Application.Dto;
using Application.Interfaces;
using Application.Services.Interfaces;
using Domain.Entities;
using System;
using System.Collections.Generic;
using System.Text;

namespace Application.Services.Implementations
{
    public class PersonService : IPersonService
    {
        private readonly IPersonRepository _personRepository;

        public PersonService(IPersonRepository personRepository)
        {
            _personRepository = personRepository;
        }

        public async Task<ApiResponse<bool>> CreatePersonAsync(CreatePersonDto personDto)
        {
            var pers = new Person
            {
                Name = personDto.Name,
                Url = personDto.ImageUrl
            };


            await _personRepository.CreateAsync(pers);
            return ApiResponse<bool>.Success(true, "Person created successfully.");
        }

        public async Task<ApiResponse<List<PersonDto>>> GetAllAsync()
        {
            var persons = await _personRepository.GetAllAsync();
            var personsDto = new List<PersonDto>();
            foreach (var person in persons)
            {
                personsDto.Add(new PersonDto
                {
                    Id = person.Id,
                    Name = person.Name,
                    ImageUrl = person.Url
                });
            }


            return ApiResponse<List<PersonDto>>.Success(personsDto, "Persons retrieved successfully.");
        }

    }

}

