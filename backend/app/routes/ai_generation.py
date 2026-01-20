"""
AI Generation Routes - Endpoints for AI story generation
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from enum import Enum
import logging

from app.database import get_db
from app.services.gemini_service import GeminiService
from app.services.prompt_builder import PromptBuilder
from app.services.memory_service import MemoryService
from app.services.story_service import StoryService
from app.services.chapter_service import ChapterService
from app.services.character_service import CharacterService
from app.models.generation import WritingMode, GenerationType
from app.models.plotline import Plotline, PlotlineStatus
from app.models.story_bible import StoryBible

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize services
gemini_service = GeminiService()
prompt_builder = PromptBuilder()
memory_service = MemoryService()
story_service = StoryService()
chapter_service = ChapterService()
character_service = CharacterService()


# Helper functions for async data fetching
async def get_active_plotlines(db: AsyncSession, story_id: UUID) -> List:
    """Fetch active plotlines (not resolved or abandoned) for a story"""
    query = select(Plotline).where(
        Plotline.story_id == story_id,
        Plotline.status.notin_([PlotlineStatus.RESOLVED, PlotlineStatus.ABANDONED])
    )
    result = await db.execute(query)
    return result.scalars().all()


async def get_story_bible(db: AsyncSession, story_id: UUID):
    """Fetch story bible for a story with world_rules eagerly loaded"""
    query = select(StoryBible).where(StoryBible.story_id == story_id).options(
        selectinload(StoryBible.world_rules)
    )
    result = await db.execute(query)
    return result.scalar_one_or_none()


class WritingModeEnum(str, Enum):
    AI_LEAD = "ai_lead"
    USER_LEAD = "user_lead"
    CO_AUTHOR = "co_author"


class GenerateRequest(BaseModel):
    story_id: UUID
    chapter_id: UUID
    writing_mode: WritingModeEnum = WritingModeEnum.CO_AUTHOR
    user_direction: Optional[str] = None
    word_target: int = Field(default=500, ge=50, le=3000)
    temperature: Optional[float] = Field(default=None, ge=0.0, le=1.0)


class RewriteRequest(BaseModel):
    story_id: UUID
    original_text: str
    instructions: str
    writing_mode: WritingModeEnum = WritingModeEnum.CO_AUTHOR


class DialogueRequest(BaseModel):
    story_id: UUID
    character_id: UUID
    scene_context: str
    dialogue_situation: str
    other_character_ids: Optional[List[UUID]] = None
    writing_mode: WritingModeEnum = WritingModeEnum.CO_AUTHOR


class BrainstormRequest(BaseModel):
    story_id: UUID
    brainstorm_type: str = Field(..., pattern="^(plot|character|scene|dialogue|conflict|ending)$")
    current_context: str
    specific_request: Optional[str] = None


class ImagePromptRequest(BaseModel):
    description: str
    image_type: str = Field(..., pattern="^(character|scene|cover)$")
    style: Optional[str] = None


@router.post("/generate")
async def generate_continuation(
    request: GenerateRequest,
    db: AsyncSession = Depends(get_db)
):
    """Generate story continuation"""
    # Get story and chapter
    story = await story_service.get_story(db, request.story_id)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    
    chapter = await chapter_service.get_chapter(db, request.chapter_id)
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    # Get characters, plotlines, and story bible using async queries
    characters = await character_service.get_characters_by_story(db, request.story_id)
    active_plotlines = await get_active_plotlines(db, request.story_id)
    story_bible = await get_story_bible(db, request.story_id)
    
    # Get recent content
    recent_content = chapter.content[-2000:] if chapter.content else ""
    
    # Get character IDs for context retrieval
    character_ids = [str(c.id) for c in characters] if characters else []
    character_names = [c.name for c in characters] if characters else []
    
    # COMPREHENSIVE RAG RETRIEVAL
    # Retrieve from all sources: chapters, characters, story bible
    retrieved_context = []
    if recent_content:
        query_text = recent_content[-500:] if len(recent_content) > 500 else recent_content
        
        # Get all relevant context in parallel
        all_context = await memory_service.retrieve_all_relevant_context(
            story_id=str(request.story_id),
            query=query_text,
            character_ids=character_ids,
            exclude_chapter_id=str(request.chapter_id)
        )
        
        # Combine retrieved context with source labels
        for chunk in all_context.get("chapters", []):
            if chunk["score"] > 0.3:  # Only include relevant chunks
                retrieved_context.append(f"[Previous Scene] {chunk['content']}")
        
        for chunk in all_context.get("characters", []):
            if chunk["score"] > 0.3:
                char_name = chunk.get("metadata", {}).get("character_name", "Character")
                retrieved_context.append(f"[{char_name} Info] {chunk['content']}")
        
        for chunk in all_context.get("bible", []):
            if chunk["score"] > 0.3:
                bible_type = chunk.get("metadata", {}).get("type", "World")
                retrieved_context.append(f"[{bible_type.upper()}] {chunk['content']}")
        
        logger.info(f"RAG retrieved: {len(all_context.get('chapters', []))} chapters, "
                   f"{len(all_context.get('characters', []))} character entries, "
                   f"{len(all_context.get('bible', []))} bible entries")
    
    # Build prompt
    prompt_parts = prompt_builder.build_continuation_prompt(
        story=story,
        chapter=chapter,
        characters=characters,
        active_plotlines=active_plotlines,
        story_bible=story_bible,
        recent_content=recent_content,
        retrieved_context=retrieved_context,
        writing_mode=WritingMode(request.writing_mode.value),
        user_direction=request.user_direction,
        word_target=request.word_target
    )
    
    # Generate content
    result = await gemini_service.generate_story_content(
        prompt=prompt_parts["user_prompt"],
        system_prompt=prompt_parts["system_prompt"],
        writing_mode=WritingMode(request.writing_mode.value),
        context=prompt_parts["context"],
        max_tokens=request.word_target * 2
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Generation failed"))
    
    # Update chapter content and save
    if chapter.content:
        chapter.content += "\n\n" + result["content"]
    else:
        chapter.content = result["content"]
    
    chapter.word_count = len(chapter.content.split())
    await db.commit()
    
    # Embed the chapter for semantic search (in background, non-blocking)
    try:
        await memory_service.embed_chapter(
            db=db,
            story_id=str(request.story_id),
            chapter_id=str(request.chapter_id),
            content=chapter.content,
            chapter_metadata={
                "title": chapter.title,
                "number": chapter.number,
                "characters": character_names  # Pass character names for metadata extraction
            }
        )
        logger.info(f"✓ Embedded chapter {request.chapter_id} in vector database")
    except Exception as e:
        logger.warning(f"Failed to embed chapter: {e}")
    
    return {
        "content": result["content"],
        "tokens_used": result.get("tokens_used"),
        "generation_time_ms": result.get("generation_time_ms"),
        "writing_mode": request.writing_mode.value
    }


@router.post("/generate/stream")
async def generate_continuation_stream(
    request: GenerateRequest,
    db: AsyncSession = Depends(get_db)
):
    """Generate story continuation with streaming response (Server-Sent Events)"""
    # Get story and chapter
    story = await story_service.get_story(db, request.story_id)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    
    chapter = await chapter_service.get_chapter(db, request.chapter_id)
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    # Get characters, plotlines, and story bible using async queries
    characters = await character_service.get_characters_by_story(db, request.story_id)
    active_plotlines = await get_active_plotlines(db, request.story_id)
    story_bible = await get_story_bible(db, request.story_id)
    
    recent_content = chapter.content[-2000:] if chapter.content else ""
    character_ids = [str(c.id) for c in characters] if characters else []
    
    # RAG retrieval for context
    retrieved_context = []
    if recent_content:
        query_text = recent_content[-500:] if len(recent_content) > 500 else recent_content
        try:
            all_context = await memory_service.retrieve_all_relevant_context(
                story_id=str(request.story_id),
                query=query_text,
                character_ids=character_ids,
                exclude_chapter_id=str(request.chapter_id)
            )
            for chunk in all_context.get("chapters", []):
                if chunk["score"] > 0.3:
                    retrieved_context.append(f"[Previous Scene] {chunk['content']}")
            for chunk in all_context.get("characters", []):
                if chunk["score"] > 0.3:
                    char_name = chunk.get("metadata", {}).get("character_name", "Character")
                    retrieved_context.append(f"[{char_name} Info] {chunk['content']}")
            for chunk in all_context.get("bible", []):
                if chunk["score"] > 0.3:
                    bible_type = chunk.get("metadata", {}).get("type", "World")
                    retrieved_context.append(f"[{bible_type.upper()}] {chunk['content']}")
        except Exception as e:
            logger.warning(f"RAG retrieval failed: {e}")
    
    # Build prompt
    prompt_parts = prompt_builder.build_continuation_prompt(
        story=story,
        chapter=chapter,
        characters=characters,
        active_plotlines=active_plotlines,
        story_bible=story_bible,
        recent_content=recent_content,
        retrieved_context=retrieved_context,
        writing_mode=WritingMode(request.writing_mode.value),
        user_direction=request.user_direction,
        word_target=request.word_target
    )
    
    # Store references for saving after generation
    story_id = str(request.story_id)
    chapter_id = str(request.chapter_id)
    character_names = [c.name for c in characters] if characters else []
    chapter_title = chapter.title
    chapter_number = chapter.number
    existing_content = chapter.content or ""
    
    async def generate_sse():
        """Generate Server-Sent Events for streaming"""
        generated_text = []
        
        try:
            async for chunk in gemini_service.generate_story_content_stream(
                prompt=prompt_parts["user_prompt"],
                system_prompt=prompt_parts["system_prompt"],
                writing_mode=WritingMode(request.writing_mode.value),
                context=prompt_parts.get("context"),
                max_tokens=request.word_target * 2
            ):
                generated_text.append(chunk)
                # SSE format: data: <content>\n\n
                yield f"data: {chunk}\n\n"
            
            # Send completion signal
            yield f"data: [DONE]\n\n"
            
            # After streaming is complete, save the content
            full_text = "".join(generated_text)
            if full_text.strip():
                # Update chapter content in database
                from app.database import get_async_session
                async with get_async_session() as save_db:
                    chap = await chapter_service.get_chapter(save_db, UUID(chapter_id))
                    if chap:
                        if chap.content:
                            chap.content += "\n\n" + full_text
                        else:
                            chap.content = full_text
                        chap.word_count = len(chap.content.split())
                        await save_db.commit()
                        
                        # Embed the updated chapter
                        try:
                            await memory_service.embed_chapter(
                                db=save_db,
                                story_id=story_id,
                                chapter_id=chapter_id,
                                content=chap.content,
                                chapter_metadata={
                                    "title": chapter_title,
                                    "number": chapter_number,
                                    "characters": character_names
                                }
                            )
                            logger.info(f"✓ Auto-embedded chapter {chapter_id} after streaming generation")
                        except Exception as e:
                            logger.warning(f"Failed to embed chapter after streaming: {e}")
                
        except Exception as e:
            logger.error(f"Streaming generation error: {e}")
            yield f"data: [ERROR] {str(e)}\n\n"
    
    return StreamingResponse(
        generate_sse(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.post("/rewrite")
async def rewrite_text(
    request: RewriteRequest,
    db: AsyncSession = Depends(get_db)
):
    """Rewrite text based on instructions"""
    story = await story_service.get_story(db, request.story_id)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    
    characters = await character_service.get_characters_by_story(db, request.story_id)
    
    prompt_parts = prompt_builder.build_rewrite_prompt(
        story=story,
        original_text=request.original_text,
        instructions=request.instructions,
        characters=characters,
        writing_mode=WritingMode(request.writing_mode.value)
    )
    
    result = await gemini_service.generate_story_content(
        prompt=prompt_parts["user_prompt"],
        system_prompt=prompt_parts["system_prompt"],
        writing_mode=WritingMode(request.writing_mode.value),
        context=prompt_parts["context"]
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Rewrite failed"))
    
    return {
        "rewritten_text": result["content"],
        "original_text": request.original_text,
        "instructions": request.instructions
    }


@router.post("/dialogue")
async def generate_dialogue(
    request: DialogueRequest,
    db: AsyncSession = Depends(get_db)
):
    """Generate character dialogue"""
    character = await character_service.get_character(db, request.character_id)
    if not character:
        raise HTTPException(status_code=404, detail="Character not found")
    
    other_characters = []
    if request.other_character_ids:
        for char_id in request.other_character_ids:
            char = await character_service.get_character(db, char_id)
            if char:
                other_characters.append(char)
    
    prompt_parts = prompt_builder.build_dialogue_prompt(
        character=character,
        scene_context=request.scene_context,
        other_characters=other_characters,
        dialogue_situation=request.dialogue_situation,
        writing_mode=WritingMode(request.writing_mode.value)
    )
    
    result = await gemini_service.generate_story_content(
        prompt=prompt_parts["user_prompt"],
        system_prompt=prompt_parts["system_prompt"],
        writing_mode=WritingMode(request.writing_mode.value)
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Dialogue generation failed"))
    
    return {
        "dialogue": result["content"],
        "character": character.name
    }


@router.post("/brainstorm")
async def brainstorm_ideas(
    request: BrainstormRequest,
    db: AsyncSession = Depends(get_db)
):
    """Brainstorm creative ideas"""
    story = await story_service.get_story(db, request.story_id)
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
    
    prompt_parts = prompt_builder.build_brainstorm_prompt(
        story=story,
        brainstorm_type=request.brainstorm_type,
        current_context=request.current_context,
        specific_request=request.specific_request
    )
    
    result = await gemini_service.generate_story_content(
        prompt=prompt_parts["user_prompt"],
        system_prompt=prompt_parts["system_prompt"],
        writing_mode=WritingMode.AI_LEAD
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Brainstorming failed"))
    
    return {
        "ideas": result["content"],
        "type": request.brainstorm_type
    }


@router.post("/image-prompt")
async def generate_image_prompt(request: ImagePromptRequest):
    """Generate structured image generation prompt"""
    result = await gemini_service.generate_image_prompt(
        description=request.description,
        image_type=request.image_type,
        style=request.style
    )
    
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Image prompt generation failed"))
    
    return {
        "image_prompt": result["content"],
        "type": request.image_type
    }
