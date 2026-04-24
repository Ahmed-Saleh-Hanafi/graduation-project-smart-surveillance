using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Text;
using System.IO;

namespace Infrastructure.Data
{
    public class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
    {
        
            public ApplicationDbContext CreateDbContext(string[] args)
            {
                var basePath = Path.Combine(Directory.GetCurrentDirectory(), "..", "Smart_Surveillance");

                var configuration = new ConfigurationBuilder()
                    .SetBasePath(basePath)
                    .AddJsonFile("appsettings.json", optional: false)
                    .Build();   

                var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();

                var connectionString = configuration.GetConnectionString("DefaultConnection");

                optionsBuilder.UseSqlServer(connectionString);

                return new ApplicationDbContext(optionsBuilder.Options);









            }
        
    }
}
