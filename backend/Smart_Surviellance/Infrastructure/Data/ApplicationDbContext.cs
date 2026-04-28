using Domain.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System.Reflection.Emit;

namespace Infrastructure.Data
{
    public class ApplicationDbContext : IdentityDbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {

        }

        public DbSet<User> Users { get; set; }
        public DbSet<Camera> Cameras { get; set; }
        public DbSet<Alert> Alerts { get; set; }
        public DbSet<Person> Persons { get; set; }
        public DbSet<CameraPersonList> CameraPersonLists{ get; set; }
        public DbSet<Detection> Detections { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);
            builder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);



            builder.Entity<CameraPersonList>()
            .HasIndex(x => new { x.CameraId, x.PersonId })
            .IsUnique();

            builder.Entity<CameraPersonList>()
                .HasOne(x => x.Camera)
                .WithMany(c => c.CameraPersonLists)
                .HasForeignKey(x => x.CameraId);

            builder.Entity<CameraPersonList>()
                .HasOne(x => x.Person)
                .WithMany(p => p.CameraPersonLists)
                .HasForeignKey(x => x.PersonId);




        }



    }
}