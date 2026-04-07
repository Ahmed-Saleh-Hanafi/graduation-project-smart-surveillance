# 🛡️ Smart Surveillance & Safety System
### *An AI-Driven Integrated Security Solution*

---

## 📖 Project Overview
The **Smart Surveillance and Safety System** is a sophisticated security framework designed to modernize environment monitoring. By integrating **Computer Vision** with **Real-time API services**, the system detects threats like fire or unauthorized access and alerts administrators instantly via a mobile dashboard.

---

## ✨ Key Features
* **🤖 AI Detection:** High-accuracy monitoring using **YOLOv8** for object and hazard detection.
* **⚡ Real-time Alerts:** Instant push notifications powered by a robust **FastAPI** backend.
* **📱 Mobile Management:** Comprehensive control panel built with **React Native & Expo**.
* **📊 Data Integrity:** Secure logging of all security events using **SQLite/MongoDB**.

---

## 🛠️ Tech Stack & Tools

| Component | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | React Native / Expo | Mobile Cross-Platform App |
| **Backend** | Python / FastAPI | High-performance API Services |
| **AI Engine** | OpenCV / YOLO | Computer Vision & Detection |
| **Database** | SQLite | Local structured data storage |

---

## 🚀 Professional Setup & Deployment

Follow these steps to deploy the system locally:

### **1️⃣ Initial Setup**
# Clone the repository
git clone [https://github.com/radwaalmodather2000/smart-surveillance-app.git](https://github.com/radwaalmodather2000/smart-surveillance-app.git)
cd smart-surveillance-app

### **2️⃣ Backend**
cd backend
pip install -r requirements.txt

# Run the FastAPI server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
### **3️⃣ Mobile Frontend (React Native)**
Open a new terminal and launch the mobile application:
cd frontend
npm install

### **Start Expo development server**
npx expo start

### **📂 Project Architecture**

├── 📱 .expo/             # Expo config & cache
├── ⚙️ backend/           # FastAPI, Python Scripts & AI Models
├── 🖼️ frontend/          # React Native Mobile Components
├── 🗄️ system.db          # Database file
└── 📜 README.md          # Project Documentation


