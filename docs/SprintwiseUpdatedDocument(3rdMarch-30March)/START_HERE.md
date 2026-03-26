# LMS Backend - Quick Start Guide

## 🚀 How to Run the Backend (No Reload Issues!)

### **Method 1: Use the Startup Script (Easiest)**

Just double-click this file:
```
start_server.bat
```

Or run in terminal:
```bash
.\start_server.bat
```

This will start the server in **stable mode** with NO auto-reload issues!

---

### **Method 2: Manual Command**

If you prefer to run manually:

```bash
# Activate virtual environment
.venv\Scripts\activate

# Start server (NO reload)
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

---

## ✅ Server URLs

Once running, access:
- **API Docs**: http://localhost:8000/api/docs
- **Health Check**: http://localhost:8000/health
- **Root**: http://localhost:8000

---

## 🛑 How to Stop

Press **Ctrl+C** in the terminal

---

## 🔄 How to Restart After Code Changes

1. Press **Ctrl+C** to stop
2. Run `.\start_server.bat` again (or the manual command)

---

## 💡 Why No Auto-Reload?

Auto-reload (`--reload` flag) causes infinite restart loops on Windows because it watches the `.venv` folder. Running without it gives you a stable, reliable server.

---

## 🧪 Test the Backend

Open this file in your browser to test:
```
test_frontend.html
```

Click "Test Create Organization" to verify everything works!

---

## 📊 Summary

✅ **Stable server** - No infinite reloads  
✅ **Fast startup** - Starts in ~2 seconds  
✅ **Easy to use** - Just run `start_server.bat`  
✅ **Production-ready** - Same command works in production  

**You're all set!** 🎉
