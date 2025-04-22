import uuid
from sqlalchemy import UUID, Boolean, Column, ForeignKey, String
from database import Base

class User(Base):
    __tablename__ = 'user'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    useragent = Column(String, index=True)
    isadmin = Column(Boolean, default=False)

class Credentials(Base):
    __tablename__ = 'credentials'

    username = Column(String, primary_key=True)
    password = Column(String, index=False)
    userid = Column(UUID, ForeignKey("user.id"))

class Token(Base):
    __tablename__ = 'token'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    token = Column(String, index=False)
    userid = Column(UUID, ForeignKey("user.id"))