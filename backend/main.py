# FastAPI + SQLite + APScheduler + Telegram Bot

from fastapi import FastAPI, HTTPException
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from apscheduler.schedulers.background import BackgroundScheduler
import requests
from telegram import Bot
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()
Base = declarative_base()
engine = create_engine('sqlite:///./monitor.db')
SessionLocal = sessionmaker(bind=engine)

# Model
class Website(Base):
    __tablename__ = 'websites'
    id = Column(Integer, primary_key=True)
    name = Column(String)
    url = Column(String)
    check_interval = Column(Integer, default=5)
    telegram_chat_id = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

# Endpoints
@app.get("/api/websites")
def get_websites():
    db = SessionLocal()
    websites = db.query(Website).all()
    db.close()
    return websites

@app.post("/api/websites")
def add_website(name: str, url: str, check_interval: int = 5, telegram_chat_id: str = None):
    db = SessionLocal()
    website = Website(name=name, url=url, check_interval=check_interval, telegram_chat_id=telegram_chat_id)
    db.add(website)
    db.commit()
    db.refresh(website)
    db.close()
    return website

@app.delete("/api/websites/{id}")
def delete_website(id: int):
    db = SessionLocal()
    website = db.query(Website).filter(Website.id == id).first()
    if not website:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(website)
    db.commit()
    db.close()
    return {"message": "Deleted"}

# Bug 3: Add API Endpoint for Update Website
@app.put("/api/websites/{id}")
def update_website(id: int, name: str = None, url: str = None, check_interval: int = None, telegram_chat_id: str = None):
    db = SessionLocal()
    website = db.query(Website).filter(Website.id == id).first()
    if not website:
        raise HTTPException(status_code=404, detail="Not found")
    
    if name:
        website.name = name
    if url:
        website.url = url
    if check_interval:
        website.check_interval = check_interval
    if telegram_chat_id is not None: # Check for None specifically, as empty string might be valid
        website.telegram_chat_id = telegram_chat_id
        
    db.commit()
    db.refresh(website)
    db.close()
    return website


# Scheduler ตรวจสอบเว็บ
scheduler = BackgroundScheduler()

def check_websites():
    db = SessionLocal()
    websites = db.query(Website).filter(Website.is_active == True).all()
    for site in websites:
        # Bug 1: Improved Exception Handling
        error_msg = None
        try:
            response = requests.get(site.url, timeout=10)
            status = "online" if response.status_code == 200 else "offline"
        except requests.exceptions.RequestException as e:
            status = "offline"
            error_msg = str(e)
        except Exception as e:
            status = "offline"
            error_msg = f"Unexpected error: {str(e)}"
        
        # Bug 2: Telegram Token Handling and Error Logging
        bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
        if status == "offline" and site.telegram_chat_id and bot_token:
            try:
                bot = Bot(token=bot_token)
                # Include error_msg in the notification if it exists
                notification_text = f"🚨 {site.name} is OFFLINE!"
                if error_msg:
                    notification_text += f"\nError: {error_msg}" # Escaped newline for Telegram
                bot.send_message(chat_id=site.telegram_chat_id, text=notification_text)
            except Exception as e:
                print(f"Failed to send Telegram message: {e}")
        elif status == "offline" and site.telegram_chat_id and not bot_token:
            print(f"Warning: TELEGRAM_BOT_TOKEN not set. Cannot send offline alert for {site.name}.")
            
    db.close()

scheduler.add_job(check_websites, 'interval', minutes=5)
scheduler.start()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
