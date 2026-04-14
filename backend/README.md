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
└── README.md                             <- Project documentation
