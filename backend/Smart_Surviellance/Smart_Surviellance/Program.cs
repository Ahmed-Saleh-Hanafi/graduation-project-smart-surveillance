using Application.Interfaces;
using Application.Services.Implementations;
using Application.Services.Interfaces;
using Domain.Entities;
using Infrastructure.Data;
using Infrastructure.Data.Seed;
using Infrastructure.Repositories;
using Infrastructure.Services;
using Infrastructure.SignalR;
using Infrastructure.MQTT;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
//builder.Services.AddOpenApi();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure Entity Framework Core with SQL Server
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));


// ======================
// 2. Add Identity
// ======================
builder.Services.AddIdentity<User, IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

// ======================
// 3. Add JWT Authentication
// ======================
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = "Bearer";
    options.DefaultChallengeScheme = "Bearer";
})
.AddJwtBearer("Bearer", options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,

        ValidIssuer = builder.Configuration["JWT:Issuer"],
        ValidAudience = builder.Configuration["JWT:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["JWT:Key"])
        )
    };

    // ✅ Required for SignalR: read JWT from query string (?access_token=...)
    // because browser WebSockets cannot send Authorization headers
    options.Events = new Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;

            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hub/alerts"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});




// ======================
// 4. Dependency Injection
// ======================

builder.Services.AddSignalR();

// Repositories
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<ICameraRepository, CameraRepository>();
builder.Services.AddScoped<IAlertRepository, AlertRepository>();
builder.Services.AddScoped<IPersonRepository, PersonRepository>();
builder.Services.AddScoped<ICameraPersonRepository, CameraPersonRepository>();
builder.Services.AddScoped<IDetectionRepository, DetectionRepository>();
builder.Services.AddScoped<IUserCameraRepository, UserCameraRepository>();
builder.Services.AddScoped<IFaceRepository, FaceRepository>();
builder.Services.AddScoped<IEventRecordedRepository, EventRecordedRepository>();
builder.Services.AddScoped<ISensorRepository , SensorRepository>();
builder.Services.AddScoped<ISensorReadingRerpository, SensorReadingRepository>();
builder.Services.AddScoped<ISensorAlertRepository, SensorAlertRepository>();
builder.Services.AddScoped<IAIScheduleRepository, AIScheduleRepository>();



// Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<ISignInService, SignInService>();
builder.Services.AddScoped<ICameraService, CameraService>();
builder.Services.AddScoped<IMediaMTXConfiqService, MediaMTXConfigService>();
builder.Services.AddScoped<IAlertService, AlertService>();
builder.Services.AddScoped<IAlertNotifier, AlertNotifier>();
builder.Services.AddScoped<IFaceProcessingService, FaceProcessingService>();
builder.Services.AddScoped<IFaceService, FaceService>();
builder.Services.AddScoped<IPersonService, PersonService>();
builder.Services.AddScoped<IDetectionService, DetectionService>();
builder.Services.AddScoped<IUserManagmentService, UserManagementService>();
builder.Services.AddScoped<IUserCameraService, UserCameraService>();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IImageService, ImageService>();
builder.Services.AddScoped<IEventRecordedService, EventRecordedService>();
builder.Services.AddScoped<IVideoService, VideoService>();
builder.Services.AddScoped<ISensorService, SensorService>();
builder.Services.AddScoped<ISensorNotifier, SensorNotifier>();
builder.Services.AddScoped<IAIScheduleService, AIScheduleService>();

builder.Services.AddHostedService<MQTTBackgroundService>();

builder.Services.AddHttpContextAccessor();






// ======================
// 5. Add CORS
// ======================
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder => builder.SetIsOriginAllowed(_ => true)                         
                          .AllowAnyMethod()
                          .AllowAnyHeader()
                          .AllowCredentials());
});





var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    //app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapHub<AlertHub>("/hub/alerts");



using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;

    var userManager = services.GetRequiredService<UserManager<User>>();
    var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();

    await IdentitySeeder.SeedAsync(userManager, roleManager);
}


app.UseHttpsRedirection();

app.UseStaticFiles();

app.UseRouting();
app.UseCors("AllowAll");



app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();