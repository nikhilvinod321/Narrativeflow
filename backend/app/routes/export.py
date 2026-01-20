"""
Export Routes - Export stories in various formats
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from uuid import UUID
import io

from app.database import get_db
from app.services.story_service import StoryService
from app.services.chapter_service import ChapterService

router = APIRouter()

story_service = StoryService()
chapter_service = ChapterService()


@router.get("/{story_id}/markdown")
async def export_markdown(
    story_id: UUID,
    include_notes: bool = False,
    db: AsyncSession = Depends(get_db)
):
    """Export story as Markdown"""
    story = await story_service.get_story(db, story_id)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    
    chapters = await chapter_service.get_story_chapters(db, story_id)
    
    # Build markdown content
    md_content = f"# {story.title}\n\n"
    
    if story.subtitle:
        md_content += f"*{story.subtitle}*\n\n"
    
    if story.logline:
        md_content += f"> {story.logline}\n\n"
    
    md_content += f"**Genre:** {story.genre.value.replace('_', ' ').title()}\n"
    md_content += f"**Tone:** {story.tone.value.title()}\n"
    md_content += f"**Word Count:** {story.word_count:,}\n\n"
    
    md_content += "---\n\n"
    
    for chapter in chapters:
        md_content += f"## Chapter {chapter.number}: {chapter.title}\n\n"
        
        if include_notes and chapter.notes:
            md_content += f"*Notes: {chapter.notes}*\n\n"
        
        if chapter.content:
            md_content += f"{chapter.content}\n\n"
        
        md_content += "---\n\n"
    
    # Return as downloadable file
    buffer = io.BytesIO(md_content.encode('utf-8'))
    
    filename = f"{story.title.replace(' ', '_')}.md"
    
    return StreamingResponse(
        buffer,
        media_type="text/markdown",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/{story_id}/text")
async def export_plain_text(
    story_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Export story as plain text"""
    story = await story_service.get_story(db, story_id)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    
    chapters = await chapter_service.get_story_chapters(db, story_id)
    
    # Build plain text content
    text_content = f"{story.title.upper()}\n"
    text_content += "=" * len(story.title) + "\n\n"
    
    if story.subtitle:
        text_content += f"{story.subtitle}\n\n"
    
    for chapter in chapters:
        text_content += f"\n\nCHAPTER {chapter.number}: {chapter.title.upper()}\n"
        text_content += "-" * 40 + "\n\n"
        
        if chapter.content:
            text_content += f"{chapter.content}\n"
    
    buffer = io.BytesIO(text_content.encode('utf-8'))
    filename = f"{story.title.replace(' ', '_')}.txt"
    
    return StreamingResponse(
        buffer,
        media_type="text/plain",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/{story_id}/json")
async def export_json(
    story_id: UUID,
    include_metadata: bool = True,
    db: AsyncSession = Depends(get_db)
):
    """Export story as JSON"""
    story = await story_service.get_story(db, story_id)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    
    chapters = await chapter_service.get_story_chapters(db, story_id)
    
    export_data = {
        "title": story.title,
        "subtitle": story.subtitle,
        "logline": story.logline,
        "synopsis": story.synopsis,
        "genre": story.genre.value,
        "tone": story.tone.value,
        "word_count": story.word_count,
        "chapters": [
            {
                "number": ch.number,
                "title": ch.title,
                "content": ch.content,
                "word_count": ch.word_count,
                "summary": ch.summary if include_metadata else None
            }
            for ch in chapters
        ]
    }
    
    if include_metadata:
        export_data["characters"] = [
            {
                "name": char.name,
                "role": char.role.value,
                "personality": char.personality_summary,
                "backstory": char.backstory
            }
            for char in story.characters
        ]
        
        export_data["plotlines"] = [
            {
                "title": plot.title,
                "description": plot.description,
                "status": plot.status.value
            }
            for plot in story.plotlines
        ]
    
    return export_data


@router.get("/{story_id}/outline")
async def export_outline(
    story_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Export story outline/structure"""
    story = await story_service.get_story(db, story_id)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    
    chapters = await chapter_service.get_story_chapters(db, story_id)
    
    outline = {
        "story": {
            "title": story.title,
            "genre": story.genre.value,
            "tone": story.tone.value,
            "logline": story.logline
        },
        "chapters": [
            {
                "number": ch.number,
                "title": ch.title,
                "summary": ch.summary,
                "outline": ch.outline,
                "key_events": ch.key_events,
                "word_count": ch.word_count,
                "status": ch.status.value
            }
            for ch in chapters
        ],
        "characters": [
            {
                "name": char.name,
                "role": char.role.value,
                "arc": char.arc_description,
                "first_appearance": char.first_appearance_chapter
            }
            for char in story.characters
        ],
        "plotlines": [
            {
                "title": plot.title,
                "type": plot.type.value,
                "status": plot.status.value,
                "setup": plot.setup,
                "resolution": plot.resolution
            }
            for plot in story.plotlines
        ]
    }
    
    return outline
