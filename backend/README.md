## Structure of Folder Backend

```

smart-surveillance/
│
├── Application/                          <- Business logic layer (use cases)
│   │
│   ├── Common/                           <- Shared utilities (e.g., ApiResponse)
│   ├── Dto/                              <- Data Transfer Objects (requests/responses)
│   ├── Interfaces/                       <- Repository contracts (abstractions)
│   ├── Services/
│   │   ├── Interfaces/                   <- Service contracts (business logic definitions)
│   │   └── Implementations/              <- Business logic implementations
│
├── Domain/                               <- Core system logic (independent layer)
│   │
│   ├── Entities/                         <- Core business models (User, Camera, Alert)
│   ├── Enums/                            <- Enumerations (roles, types, statuses)
│   └── Dependencies/                     <- Minimal shared domain logic (if needed)
│
├── Infrastructure/                       <- External concerns (DB, services)
│   │
│   ├── Data/
│   │   ├── Configurations/               <- EF Core model configurations (Fluent API)
│   │   ├── ApplicationDbContext.cs       <- Database context (DbSets, connection)
│   │   └── Migrations/                   <- Database migration files
│   │
│   ├── Repositories/                     <- Repository implementations (DB queries)
│   ├── Services/                         <- External services (email, storage, etc.)
│   └── Dependencies/                     <- Dependency Injection setup
│
├── Smart_Surveillance/                   <- Presentation layer (API)
│   │
│   ├── Controllers/                      <- API endpoints (handle HTTP requests)
│   ├── Properties/                       <- Project settings (launch profiles)
│   ├── appsettings.json                  <- App configuration (DB, JWT, etc.)
│   ├── launchSettings.json               <- Local run configuration
│   └── Connected Services/               <- External integrations (Azure, APIs)
│
└── README.md                             <- documentation for folder backend

```
---

### Backend Project Setup

## Step One
### Configure Environment Variables

This will be found in appsetting.json so you can configure the Db connection string and JWT token Variables
```

{
  "ConnectionStrings": {
    "DefaultConnection": "Server=.;Database=SmartSurveillanceDB;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True"
  },

  "JWT": {
    "Key": "aishfkanm%^&*(734iaksjdjkafkn12345_SECURE_KEY!",
    "Issuer": "YourApp",
    "Audience": "YourAppUsers"
  },

  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

## Step Two

### Restore Dependencies
```
dotnet restore
```

## Step Three

### Apply Database Migrations
```
dotnet ef database update
```
### Api Base URL

This will be available to change in Properties Folder in LaunchSettings.json

Current URL is 
```
https://localhost:7274
```
```
http://localhost:5198
```

## Test Api IN Swagger
```
https://localhost:7274/swagger/index.html
```





