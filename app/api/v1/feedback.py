import json
import os
from fastapi import APIRouter, status
import structlog
from app.schemas.feedback import FeedbackCreate

logger = structlog.get_logger()
router = APIRouter(prefix="/feedback", tags=["Feedback"])

FEEDBACK_FILE = "feedback.json"

@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Submit user feedback",
    description="Allows real users to submit feedback. The reviews are kept private and visible only to the product owner.",
)
async def submit_feedback(data: FeedbackCreate):
    feedback_entry = {
        "name": data.name,
        "role": data.role,
        "rating": data.rating,
        "comment": data.comment,
    }
    
    # 1. Log structured telemetry data (for product owner logs)
    await logger.ainfo(
        "user_feedback_received",
        **feedback_entry
    )

    # 2. Append to a persistent local JSON file in workspace root
    try:
        entries = []
        if os.path.exists(FEEDBACK_FILE):
            with open(FEEDBACK_FILE, "r", encoding="utf-8") as f:
                content = f.read().strip()
                if content:
                    entries = json.loads(content)
        
        entries.append(feedback_entry)
        
        with open(FEEDBACK_FILE, "w", encoding="utf-8") as f:
            json.dump(entries, f, indent=2, ensure_ascii=False)
            
    except Exception as e:
        # Don't fail the request if file write fails, but log the error
        await logger.aerror("failed_to_save_feedback_to_file", error=str(e))

    return {"message": "Feedback submitted successfully. Thank you!"}
