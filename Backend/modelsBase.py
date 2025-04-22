from pydantic import BaseModel, UUID4

class User(BaseModel):
    useragent: str
    isadmin: bool

class Credentials(BaseModel):
    username: str
    password: str
    userid: str

class Token(BaseModel):
    token: str
    userid: str