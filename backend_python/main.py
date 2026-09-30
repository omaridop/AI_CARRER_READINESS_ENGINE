from fastapi import FastAPI, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
import asyncio
import uuid
import json
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

progress_events = {}
final_results = {}

@app.get("/")
def read_root():
    return {"message": "SkillBridge API (Python/FastAPI)"}

@app.post("/api/live/magic")
async def start_magic(request: Request, background_tasks: BackgroundTasks):
    body = await request.json()
    job_id = str(uuid.uuid4())
    progress_events[job_id] = asyncio.Queue()
    
    # Run pipeline in background
    background_tasks.add_task(run_magic_pipeline, job_id, body)
    
    return {"data": {"jobId": job_id}, "error": None}

@app.get("/api/live/progress/{job_id}")
async def get_progress(job_id: str):
    if job_id not in progress_events:
        return JSONResponse(status_code=404, content={"error": "Job not found"})
    
    async def event_generator():
        queue = progress_events[job_id]
        while True:
            event = await queue.get()
            if event["type"] == "progress":
                yield f"event: progress\ndata: {json.dumps(event['data'])}\n\n"
            elif event["type"] == "complete":
                yield f"event: complete\ndata: {json.dumps(event['data'])}\n\n"
                break
            elif event["type"] == "error":
                yield f"event: error\ndata: {json.dumps({'message': event['data']})}\n\n"
                break
                
    return StreamingResponse(event_generator(), media_type="text/event-stream")

async def run_magic_pipeline(job_id: str, data: dict):
    queue = progress_events[job_id]
    
    def emit(step, message, detail=None, percent=0):
        queue.put_nowait({
            "type": "progress",
            "data": {
                "step": step,
                "message": message,
                "detail": detail,
                "percent": percent
            }
        })
        
    try:
        emit("start", "Starting Python pipeline...", "Initializing", 5)
        await asyncio.sleep(1)
        
        # TODO: Implement scraping, AI, SQLite
        emit("scrape", "Scraping jobs...", "LinkedIn", 20)
        await asyncio.sleep(2)
        
        # Stub result to satisfy frontend
        result = {
            "scrapedJobsCount": 15,
            "analyzedJobsCount": 5,
            "dynamicSkills": [],
            "similarityScore": 85,
            "matchedSkills": [],
            "missingSkills": [],
            "enhancedProfile": ""
        }
        
        queue.put_nowait({
            "type": "complete",
            "data": result
        })
        final_results[job_id] = result
        
    except Exception as e:
        queue.put_nowait({"type": "error", "data": str(e)})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=3001, reload=True)
