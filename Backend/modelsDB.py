import uuid
from sqlalchemy import UUID, Column, DateTime, ForeignKey, String
from database import Base

class Credentials(Base):
    __tablename__ = 'credentials'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String, unique=True)
    password = Column(String, index=False)

class SessionToken(Base):
    __tablename__ = 'sessiontoken'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    token = Column(String, index=False)
    expiry_date = Column(DateTime, index=False)
    userid = Column(UUID, ForeignKey("credentials.id"))