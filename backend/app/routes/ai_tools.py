"""
AI Tools Routes - Story recap, consistency check, and analysis tools
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID

from app.database import get_db
from app.services.gemini_service import GeminiService
from app.services.prompt_builder import PromptBuilder
from app.services.consistency_engine import ConsistencyEngine
from app.services.story_service import StoryService
from app.services.chapter_service import ChapterService
from app.services.character_service import CharacterService
from app.models.plotline import Plotline, PlotlineStatus
from app.models.story_bible import StoryBible

router = APIRouter()

# Initialize services
gemini_service = GeminiService()
prompt_builder = PromptBuilder()
consistency_engine = ConsistencyEngine(gemini_service)
story_service = StoryService()
chapter_service = ChapterService()
character_service = CharacterService()


# Helper functions for async data fetching
async def get_all_plotlines(db: AsyncSession, story_id: UUID) -> List:
    """Fetch all plotlines for a story"""
    query = select(Plotline).where(Plotline.story_id == story_id)
    result = await db.execute(query)
    return result.scalars().all()


async def get_story_bible(db: AsyncSession, story_id: UUID):
    """Fetch story bible for a story with world_rules eagerly loaded"""
    query = select(StoryBible).where(StoryBible.story_id == story_id).options(
        selectinload(StoryBible.world_rules)
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


class RecapRequest(BaseModel):
    story_id: UUID


class ConsistencyCheckRequest(BaseModel):
    story_id: UUID
    content: str
    chapter_id: Optional[UUID] = None


class SummarizeRequest(BaseModel):
    content: str
    summary_type: str = "chapter"  # chapter, story, character


class AnalyzeCharacterRequest(BaseModel):
    story_id: UUID
    character_id: UUID
    content: str


@router.post("/recap")
async def generate_story_recap(
    request: RecapRequest,
    db: AsyncSession = Depends(get_db)
):
    """Generate comprehensive story recap"""
    story = await story_service.get_story(db, request.story_id)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    
    # Get all chapters, characters, and plotlines
    chapters = await chapter_service.get_story_chapters(db, request.story_id)
    characters = await character_service.get_characters_by_story(db, request.story_id)
    plotlines = await get_all_plotlines(db, request.story_id)
    
    # Build recap prompt
    prompt_parts = prompt_builder.build_recap_prompt(
        story=story,
        chapters=chapters,
        characters=characters,
        plotlines=plotlines
    )
    
    result = await gemini_service.generate_story_content(
        prompt=prompt_parts["user_prompt"],
        system_prompt=prompt_parts["system_prompt"],
        writing_mode="user_lead",
        max_tokens=2000
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=500, detail="Recap generation failed")
    
    return {
        "recap": result["content"],
        "story_title": story.title,
        "chapter_count": len(chapters),
        "character_count": len(characters),
        "word_count": story.word_count
    }


@router.post("/consistency-check")
async def check_consistency(
    request: ConsistencyCheckRequest,
    db: AsyncSession = Depends(get_db)
):
    """Check content for consistency issues"""
    story = await story_service.get_story(db, request.story_id)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    
    characters = await character_service.get_characters_by_story(db, request.story_id)
    chapters = await chapter_service.get_story_chapters(db, request.story_id)
    plotlines = await get_all_plotlines(db, request.story_id)
    story_bible = await get_story_bible(db, request.story_id)
    
    # Get current chapter if provided
    current_chapter = None
    if request.chapter_id:
        current_chapter = await chapter_service.get_chapter(db, request.chapter_id)
    
    # Run consistency analysis
    report = await consistency_engine.analyze_content(
        content=request.content,
        story=story,
        characters=characters,
        plotlines=plotlines,
        story_bible=story_bible,
        previous_chapters=chapters,
        current_chapter=current_chapter
    )
    
    return {
        "score": report.overall_score,
        "summary": report.summary,
        "issues": [
            {
                "type": issue.type.value,
                "severity": issue.severity.value,
                "description": issue.description,
                "location": issue.location,
                "suggestion": issue.suggestion
            }
            for issue in report.issues
        ],
        "recommendations": report.recommendations,
        "has_critical_issues": report.has_critical_issues
    }


@router.post("/quick-check")
async def quick_consistency_check(
    request: ConsistencyCheckRequest,
    db: AsyncSession = Depends(get_db)
):
    """Quick consistency check for real-time feedback"""
    story = await story_service.get_story(db, request.story_id, include_relations=False)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    
    characters = await character_service.get_characters_by_story(db, request.story_id)
    
    issues = await consistency_engine.quick_check(
        content=request.content,
        characters=characters,
        story=story
    )
    
    return {
        "issues": [
            {
                "type": issue.type.value,
                "severity": issue.severity.value,
                "description": issue.description
            }
            for issue in issues
        ],
        "issue_count": len(issues)
    }


@router.post("/summarize")
async def summarize_content(request: SummarizeRequest):
    """Generate summary of content"""
    result = await gemini_service.generate_summary(
        content=request.content,
        summary_type=request.summary_type
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=500, detail="Summarization failed")
    
    return {
        "summary": result["content"],
        "type": request.summary_type
    }


@router.post("/analyze-character")
async def analyze_character_in_content(
    request: AnalyzeCharacterRequest,
    db: AsyncSession = Depends(get_db)
):
    """Analyze how a character is portrayed in content"""
    character = await character_service.get_character(db, request.character_id)
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    
    # Get character profile for comparison
    profile = await character_service.get_character_profile_for_ai(db, request.character_id)
    
    system_prompt = """Analyze how this character is portrayed in the given content. 
Compare against their established profile and identify:
1. Consistency with established personality
2. Voice/dialogue authenticity  
3. Actions that align or conflict with their nature
4. Development or changes from their baseline
5. Suggestions for improvement"""
    
    prompt = f"""CHARACTER PROFILE:
{profile}

CONTENT TO ANALYZE:
{request.content}

Provide detailed character analysis:"""
    
    result = await gemini_service.generate_story_content(
        prompt=prompt,
        system_prompt=system_prompt,
        writing_mode="user_lead",
        max_tokens=1000
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=500, detail="Analysis failed")
    
    return {
        "analysis": result["content"],
        "character": character.name
    }


@router.get("/story/{story_id}/stats")
async def get_story_analysis_stats(
    story_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get comprehensive story analysis statistics"""
    story = await story_service.get_story(db, story_id)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    
    chapters = await chapter_service.get_story_chapters(db, story_id)
    characters = await character_service.get_characters_by_story(db, story_id)
    plotlines = await get_all_plotlines(db, story_id)
    
    # Calculate various stats
    total_words = sum(ch.word_count for ch in chapters)
    avg_chapter_length = total_words / len(chapters) if chapters else 0
    
    character_appearances = {}
    for char in characters:
        character_appearances[char.name] = len(char.chapter_appearances or [])
    
    plotline_status = {}
    for plot in plotlines:
        status = plot.status.value
        plotline_status[status] = plotline_status.get(status, 0) + 1
    
    return {
        "story_title": story.title,
        "total_words": total_words,
        "chapter_count": len(chapters),
        "average_chapter_length": round(avg_chapter_length),
        "character_count": len(characters),
        "character_appearances": character_appearances,
        "plotline_status": plotline_status,
        "genre": story.genre.value,
        "tone": story.tone.value,
        "status": story.status.value,
        "estimated_reading_time_minutes": total_words // 200
    }
