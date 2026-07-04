from pydantic import BaseModel, Field

class FeedbackCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    role: str | None = Field(None, max_length=100)
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field(..., min_length=1, max_length=1000)
