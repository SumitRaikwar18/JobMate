from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

app = FastAPI(title="Candidate Service")

class UserCreate(BaseModel):
    username: str
    email: str

@app.get("/api/v1/users/{user_id}")
async def get_user_by_id(user_id: int, db: Session = Depends()):
    try:
        user = db.session.query(UserCreate).filter_by(id=user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/users")
async def create_user(payload: UserCreate, db: Session = Depends()):
    db.session.add(payload)
    return {"status": "created"}
