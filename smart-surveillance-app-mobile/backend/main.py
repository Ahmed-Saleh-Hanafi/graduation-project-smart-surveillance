from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
from typing import List, Optional
import sqlite3
import bcrypt
import threading
import datetime
import re

app = FastAPI()

# 1. إعداد الـ CORS لضمان اتصال الموبايل بالسيرفر
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- دالات المساعدة (Helper Functions) ---
def get_db_connection():
    # إضافة timeout لمنع خطأ الـ "Resource busy or locked"
    conn = sqlite3.connect('system.db', timeout=10)
    conn.row_factory = sqlite3.Row 
    return conn

def hash_password(password: str):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

# --- تهيئة قاعدة البيانات (Database Init) ---
def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("PRAGMA foreign_keys = ON;") 

    # أ. جدول المواقع (Site)
    cursor.execute('''CREATE TABLE IF NOT EXISTS sites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT CHECK(type IN ('Home', 'Bank', 'Factory'))
    )''')

    # ب. جدول المستخدمين
    cursor.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL, 
        role TEXT CHECK(role IN ('Admin', 'User')),
        site_id INTEGER,
        FOREIGN KEY (site_id) REFERENCES sites (id)
    )''')

    # ج. جدول الكاميرات (مضاف إليه حالة التشغيل و الـ IP الفني)
    cursor.execute('''CREATE TABLE IF NOT EXISTS cameras (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        ip_address TEXT,
        rtsp_url TEXT NOT NULL,
        location TEXT,
        is_active INTEGER DEFAULT 1,
        site_id INTEGER,
        FOREIGN KEY (site_id) REFERENCES sites (id)
    )''')

    # د. جدول الحساسات (مجهز لاستقبال قراءات الهاردوير)
    cursor.execute('''CREATE TABLE IF NOT EXISTS sensors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        status_text TEXT DEFAULT 'Normal',
        value REAL DEFAULT 0.0,
        is_active INTEGER DEFAULT 1,
        site_id INTEGER,
        FOREIGN KEY (site_id) REFERENCES sites (id)
    )''')

    # هـ. جدول التنبيهات
    cursor.execute('''CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        severity TEXT,
        camera_id INTEGER,
        timestamp DATETIME DEFAULT (datetime('now','localtime')),
        FOREIGN KEY (camera_id) REFERENCES cameras (id)
    )''')
       # جدول مهام الذكاء الاصطناعي
    cursor.execute('''CREATE TABLE IF NOT EXISTS ai_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_type TEXT NOT NULL, -- (Object Search, Anomaly Detection)
        camera_name TEXT NOT NULL,
        status TEXT DEFAULT 'Queued', -- (Running, Queued, Completed)
        scheduled_time TEXT,
        site_id INTEGER
    )''')
        # جدول قواعد الأتمتة (Automation Rules)
    cursor.execute('''CREATE TABLE IF NOT EXISTS rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rule_name TEXT NOT NULL,
        trigger_condition TEXT NOT NULL, -- (IF Motion > 5s)
        action_task TEXT NOT NULL,      -- (THEN Trigger Siren)
        is_active INTEGER DEFAULT 1,
        site_id INTEGER,
        FOREIGN KEY (site_id) REFERENCES sites (id)
    )''')
    # جدول الإعدادات العامة (Global Config)
    cursor.execute('''CREATE TABLE IF NOT EXISTS config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        push_notifications INTEGER DEFAULT 1,
        recording_storage_days INTEGER DEFAULT 7,
        ai_sensitivity REAL DEFAULT 0.5,
        site_id INTEGER,
        FOREIGN KEY (site_id) REFERENCES sites (id)
    )''')
    
    # --- إضافة بيانات تجريبية مطابقة للسكرينات (Seeding) ---
    cursor.execute("SELECT COUNT(*) FROM sites")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO sites (name, type) VALUES (?, ?)", ("Global Facility", "Factory"))
        site_id = cursor.lastrowid

        hashed_pw = hash_password("123456")
        cursor.execute("INSERT INTO users (username, email, password_hash, role, site_id) VALUES (?,?,?,?,?)",
                       ("Radwa Admin", "admin@sys.com", hashed_pw, "Admin", site_id))

        # إضافة كاميرات وحساسات افتراضية (بناءً على الصور المرسلة)
        cursor.execute("INSERT INTO cameras (name, ip_address, rtsp_url, location, site_id) VALUES (?,?,?,?,?)",
                       ("Main Gate", "192.168.1.101", "rtsp://admin:123@192.168.1.101:554/live", "Exterior", site_id))
        
     
        cursor.executemany("INSERT INTO sensors (type, status_text, value, site_id) VALUES (?,?,?,?)", [
            ('Smoke Detector A', '0 PPM', 0.0, site_id),
            ('Motion Sensor B', 'Clear', 0.0, site_id)
        ])

        
    
    conn.commit()
    conn.close()

init_db()

# --- النماذج (Schemas) ---
class LoginSchema(BaseModel):
    email: str
    password: str

class CameraAddSchema(BaseModel):
    name: str
    ip: str
    location: str
    username: str
    password: str
    site_id: int

    @validator('ip')
    def validate_ip(cls, v):
        if not re.match(r"^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$", v):
            raise ValueError('Invalid IP Address format for hardware')
        return v

# --- المسارات (Endpoints) ---

@app.post("/login")
async def login(user: LoginSchema):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (user.email,))
    db_user = cursor.fetchone()
    conn.close()
    if not db_user or not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid Credentials")
    return {"role": db_user["role"], "username": db_user["username"], "site_id": db_user["site_id"]}

@app.get("/cameras/{site_id}")
async def get_cameras(site_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM cameras WHERE site_id = ?", (site_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

@app.post("/cameras/add")
async def add_camera(camera: CameraAddSchema):
    conn = get_db_connection()
    cursor = conn.cursor()
    # بناء RTSP URL احترافي لربط الكاميرا الهاردوير
    generated_rtsp = f"rtsp://{camera.username}:{camera.password}@{camera.ip}:554/stream"
    try:
        cursor.execute(
            "INSERT INTO cameras (name, ip_address, rtsp_url, location, site_id) VALUES (?, ?, ?, ?, ?)",
            (camera.name, camera.ip, generated_rtsp, camera.location, camera.site_id)
        )
        conn.commit()
        return {"message": "Hardware camera registered"}
    finally:
        conn.close()

# جديد: تغيير حالة الجهاز (On/Off) - للأدمن
@app.patch("/devices/toggle/{device_type}/{id}")
async def toggle_device(device_type: str, id: int, status: bool):
    conn = get_db_connection()
    cursor = conn.cursor()
    table = "cameras" if device_type == "camera" else "sensors"
    cursor.execute(f"UPDATE {table} SET is_active = ? WHERE id = ?", (int(status), id))
    conn.commit()
    conn.close()
    return {"message": "Device status updated"}

# جديد: حذف جهاز (أيقونة السلة) - للأدمن
@app.delete("/devices/delete/{device_type}/{id}")
async def delete_device(device_type: str, id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    table = "cameras" if device_type == "camera" else "sensors"
    cursor.execute(f"DELETE FROM {table} WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return {"message": "Device removed successfully"}

@app.get("/sensors/{site_id}")
async def get_sensors(site_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sensors WHERE site_id = ?", (site_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

# 1. جلب كل المستخدمين التابعين للموقع (صورة 4.10)
@app.get("/users/{site_id}")
async def get_site_users(site_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, email, role FROM users WHERE site_id = ?", (site_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

# 2. إضافة مستخدم جديد (Modal إضافة مستخدم - صورة 4.9)
class UserAddSchema(BaseModel):
    username: str
    email: str
    password: str
    role: str
    site_id: int

@app.post("/users/add")
async def add_new_user(user: UserAddSchema):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        hashed_pw = hash_password(user.password)
        cursor.execute(
            "INSERT INTO users (username, email, password_hash, role, site_id) VALUES (?, ?, ?, ?, ?)",
            (user.username, user.email, hashed_pw, user.role, user.site_id)
        )
        conn.commit()
        return {"message": "User added successfully"}
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Email already exists")
    finally:
        conn.close()

# 3. حذف مستخدم
@app.delete("/users/delete/{user_id}")
async def delete_user(user_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()
    return {"message": "User removed"}



@app.get("/ai-tasks/{site_id}")
async def get_ai_tasks(site_id: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM ai_tasks WHERE site_id = ?", (site_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]