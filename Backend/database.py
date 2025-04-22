from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

from dotenv import load_dotenv
import os

load_dotenv()

engine = create_async_engine(os.getenv('DATABASE_URL'))

SessionLocal = sessionmaker(autocommit=False, class_=AsyncSession, expire_on_commit=False, autoflush=False, bind=engine)

Base = declarative_base()