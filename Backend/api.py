import threading
import uuid
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from pipeline import run_research_pipeline

app = FastAPI(title="Multi-Agent Research API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

jobs: dict[str, dict[str, Any]] = {}


class ResearchRequest(BaseModel):
    topic: str = Field(..., min_length=3, description="Research topic to investigate")


class ResearchResponse(BaseModel):
    job_id: str
    status: str
    message: str


@app.get("/")
def health_check() -> dict[str, str]:
    return {"status": "ok", "message": "Multi-Agent Research API is running"}


@app.post("/research", response_model=ResearchResponse)
def start_research(request: ResearchRequest) -> ResearchResponse:
    job_id = str(uuid.uuid4())

    initial_state = {
        "job_id": job_id,
        "topic": request.topic,
        "status": "queued",
        "current_step": "queued",
        "progress": 0,
        "steps": {},
    }
    jobs[job_id] = initial_state

    def run_job() -> None:
        try:
            def update_state(step_name: str, state: dict[str, Any]) -> None:
                jobs[job_id].update(state)
                jobs[job_id]["current_step"] = step_name

            run_research_pipeline(request.topic, step_callback=update_state)
            jobs[job_id]["status"] = "completed"
            jobs[job_id]["message"] = "Research completed successfully"
        except Exception as exc:
            jobs[job_id]["status"] = "failed"
            jobs[job_id]["message"] = str(exc)
            jobs[job_id]["error"] = str(exc)

    thread = threading.Thread(target=run_job, daemon=True)
    thread.start()

    return ResearchResponse(
        job_id=job_id,
        status="queued",
        message="Research started successfully",
    )


@app.get("/research/{job_id}")
def get_research_status(job_id: str) -> dict[str, Any]:
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
