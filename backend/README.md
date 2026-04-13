Smart Surveillance System Backend

<p align="center"> A scalable backend built with <b>ASP.NET Core</b> following <b>Clean Architecture</b> principles for a Smart Surveillance System. </p> <p align="center"> <img src="https://img.shields.io/badge/.NET-8.0-blueviolet?style=for-the-badge&logo=dotnet" /> <img src="https://img.shields.io/badge/Architecture-Clean%20Architecture-brightgreen?style=for-the-badge" /> <img src="https://img.shields.io/badge/Database-Entity%20Framework%20Core-blue?style=for-the-badge" /> <img src="https://img.shields.io/badge/Auth-Identity%20%26%20JWT-orange?style=for-the-badge" /> <img src="https://img.shields.io/badge/Status-In%20Development-yellow?style=for-the-badge" /> </p>


---

# 📂 Project Structure

This project follows a **Clean Architecture** approach.

## 🧱 Overall Structure

```
Solution 'Smart_Surveillance'
│
├── Application
│   ├── Dto
│   ├── Interfaces
│   └── Services
│
├── Domain
│   ├── Entities
│   └── Enums
│
├── Infrastructure
│   └── Data
│       ├── Configurations
│       ├── ApplicationDbContext.cs
│       └── Migrations
│
└── Smart_Surveillance (API)
    ├── Controllers
    ├── appsettings.json
    └── Program.cs
```

---

## 🧩 Layer Responsibilities

### 🔹 Application Layer

Contains business logic and application rules.

* **Dto** → Request/response models
* **Interfaces** → Service & repository contracts
* **Services** → Business logic implementation

---

### 🔹 Domain Layer

Core of the system (pure business models).

* **Entities** → Main domain models
* **Enums** → Constant values

---

### 🔹 Infrastructure Layer

Handles database and external systems.

* **Configurations** → EF Core entity configurations
* **ApplicationDbContext** → Database context
* **Migrations** → Database schema changes

---

### 🔹 API Layer (Smart_Surveillance)

Entry point of the application.

* **Controllers** → API endpoints
* **appsettings.json** → Configuration settings
* **Program.cs** → Startup configuration


