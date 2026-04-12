# Smart Surveillance and Safety System - Backend

## 📌 Overview

The **Smart Surveillance and Safety System** is an AI-powered platform designed to enhance public safety through real-time monitoring, automated threat detection, and intelligent event analysis.

Traditional surveillance systems rely heavily on manual monitoring, which leads to delayed responses and missed critical events. This project introduces an intelligent backend system that integrates **Artificial Intelligence, Computer Vision, and IoT** to detect abnormal and safety-critical activities in real-time.

---

## 🚀 Key Features

* 🔐 Authentication & Authorization (JWT-based)
* 📡 Real-time event detection integration (AI models)
* 🎥 Camera management system
* 🌡️ Sensor integration (motion, smoke, gas, etc.)
* 🚨 Real-time alerts & notifications
* 🧠 Abnormal behavior detection (violence, theft, fire, etc.)
* 🧍 Face recognition & identity verification
* 📊 Event logging & history tracking
* 📱 Dashboard support (Web & Mobile APIs)
* ⚡ Scalable and modular architecture

---

## 🧱 Architecture

This project follows **Clean Architecture** to ensure scalability, maintainability, and separation of concerns.

### Layers:

* **Domain Layer**

  * Core business logic
  * Entities & Value Objects
  * Interfaces (contracts)

* **Application Layer**

  * Use Cases / Services
  * DTOs
  * Validation
  * Business rules

* **Infrastructure Layer**

  * Database access (EF Core)
  * External services integration
  * File storage / logging

* **API Layer**

  * Controllers
  * Endpoints
  * Middleware
  * Swagger configuration

---

## 🛠️ Technologies Used

* ASP.NET Core
* Entity Framework Core
* SQL Server
* JWT Authentication
* AutoMapper
* MediatR (CQRS Pattern)
* FluentValidation
* Swagger (OpenAPI)
* Logging & Exception Handling Middleware

---

## 🤖 AI & Detection Capabilities

The system integrates with AI models to detect:

* Violence & abuse
* Theft & robbery
* Fire & smoke
* Explosions
* Weapon detection
* Vandalism
* Restricted-area breaches
* Suspicious/abnormal behavior
* Face recognition & identity verification

---

## 📊 Datasets

* **UCF-Crime Dataset** + curated videos (~4,500 samples)
* Image datasets (~10,000 samples) from:

  * Kaggle
  * Hugging Face

These datasets improve detection accuracy and reduce false positives.

---

## 🔄 System Workflow

1. Cameras stream video to edge devices
2. AI models analyze video in real-time
3. If abnormal activity is detected:

   * A probability score is generated
   * If threshold exceeded → event triggered
4. Relevant video segment + metadata sent to backend
5. Backend:

   * Stores event
   * Triggers alerts
   * Sends data to dashboard

---

## ⚙️ Getting Started

### Prerequisites

* .NET SDK
* SQL Server
* Visual Studio / VS Code

### Installation

```bash
git clone <your-repo-link>
cd <project-folder>
```

### Apply Migrations

```bash
dotnet ef database update
```

### Run the Project

```bash
dotnet run
```

---

## 🔐 Configuration

Update `appsettings.json`:

```json
"ConnectionStrings": {
  "DefaultConnection": "your_connection_string"
},
"Jwt": {
  "Key": "your_secret_key",
  "Issuer": "your_issuer",
  "Audience": "your_audience"
}
```

---

## 📡 API Documentation

Swagger UI will be available at:

```
https://localhost:<port>/swagger
```

---

## 📁 Project Structure

```
/src
 ├── Domain
 ├── Application
 ├── Infrastructure
 └── API
```

---

## 📈 Future Improvements

* Real-time notifications (SignalR)
* AI model optimization
* Cloud deployment (Azure / AWS)
* Microservices architecture
* Advanced analytics dashboard

---

## 👨‍💻 Contributors

* Backend Team

---

## 📄 License

This project is for educational and research purposes.
