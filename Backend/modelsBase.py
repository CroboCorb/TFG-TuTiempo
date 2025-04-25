from datetime import datetime
from pydantic import BaseModel, UUID4

class Credentials(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    token: str
    expiry_date: datetime
    userid: UUID4