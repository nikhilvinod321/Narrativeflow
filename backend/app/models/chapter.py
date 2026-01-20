"""
Chapter Model - Story chapters/sections
"""
from sqlalchemy import Column, String, Text, Boolean, DateTime, Integer, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.database import Base


class ChapterStatus(str, enum.Enum):
    """Chapter status"""
    OUTLINE = "outline"
    DRAFT = "draft"
    REVISED = "revised"
    FINAL = "final"


class Chapter(Base):
    """Chapter model for story sections"""
    __tablename__ = "chapters"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    story_id = Column(UUID(as_uuid=True), ForeignKey("stories.id", ondelete="CASCADE"), nullable=False)
    
    # Basic info
    title = Column(String(500), nullable=False)
    number = Column(Integer, nullable=False)  # Chapter number (1, 2, 3...)
    order = Column(Integer, nullable=False)  # Order for sorting
    
    # Content
    content = Column(Text, default="")  # Main chapter content
    summary = Column(Text, nullable=True)  # AI-generated chapter summary
    notes = Column(Text, nullable=True)  # Author notes
    
    # Outline
    outline = Column(Text, nullable=True)  # Chapter outline/plan
    key_events = Column(JSONB, default=list)  # List of key events
    
    # Status
    status = Column(Enum(ChapterStatus), default=ChapterStatus.DRAFT)
    is_locked = Column(Boolean, default=False)  # Prevent AI modifications
    
    # POV tracking
    pov_character_id = Column(UUID(as_uuid=True), ForeignKey("characters.id", ondelete="SET NULL"), nullable=True)
    
    # Scene information
    scene_count = Column(Integer, default=1)
    scenes = Column(JSONB, default=list)  # Scene breakdown
    
    # Statistics
    word_count = Column(Integer, default=0)
    target_word_count = Column(Integer, nullable=True)
    reading_time_minutes = Column(Integer, default=0)
    
    # AI generation metadata
    last_ai_summary = Column(Text, nullable=True)
    ai_generated_percentage = Column(Integer, default=0)  # % written by AI
    
    # Visual
    cover_image_url = Column(Text, nullable=True)
    cover_prompt = Column(Text, nullable=True)
    
    # Timeline
    story_timeline_start = Column(String(200), nullable=True)  # When chapter starts in story time
    story_timeline_end = Column(String(200), nullable=True)  # When chapter ends in story time
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    story = relationship("Story", back_populates="chapters")
    pov_character = relationship("Character", foreign_keys=[pov_character_id])
    embeddings = relationship("StoryEmbedding", back_populates="chapter", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Chapter {self.number}: '{self.title}'>"
    
    def calculate_word_count(self):
        """Calculate word count from content"""
        if self.content:
            self.word_count = len(self.content.split())
            self.reading_time_minutes = max(1, self.word_count // 200)  # ~200 words per minute
        return self.word_count
