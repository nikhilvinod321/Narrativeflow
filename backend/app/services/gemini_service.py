"""
AI Service - Core AI integration for NarrativeFlow
Handles all communication with Ollama API
"""
import httpx
from typing import Optional, List, Dict, Any, AsyncGenerator
import asyncio
import logging
import time
import json

from app.config import settings
from app.models.generation import WritingMode, GenerationType

logger = logging.getLogger(__name__)


class GeminiService:
    """
    Service for interacting with Ollama API (renamed for backwards compatibility)
    Handles story generation, rewriting, analysis, and more
    """
    
    def __init__(self):
        self.base_url = settings.ollama_base_url
        self.model_name = settings.ollama_model
        self.vision_model_name = settings.ollama_model
        self.client = httpx.AsyncClient(timeout=600.0)  # 10 minute timeout for large generations
        
        # Generation settings by mode
        self.mode_settings = {
            WritingMode.AI_LEAD: {
                "temperature": settings.temperature_creative,
                "top_p": 0.95,
                "top_k": 40,
            },
            WritingMode.USER_LEAD: {
                "temperature": settings.temperature_precise,
                "top_p": 0.8,
                "top_k": 20,
            },
            WritingMode.CO_AUTHOR: {
                "temperature": settings.temperature_balanced,
                "top_p": 0.9,
                "top_k": 30,
            }
        }
        logger.info(f"Ollama API configured with model: {self.model_name} at {self.base_url}")
    
    def _get_generation_options(
        self,
        writing_mode: WritingMode,
        max_tokens: Optional[int] = None,
        temperature_override: Optional[float] = None
    ) -> Dict[str, Any]:
        """Get generation options based on writing mode with pronounced differences"""
        mode_config = self.mode_settings.get(writing_mode, self.mode_settings[WritingMode.CO_AUTHOR])
        
        # Make temperature differences more pronounced
        if temperature_override is None:
            if writing_mode == WritingMode.AI_LEAD:
                temperature = 0.95  # Very creative
            elif writing_mode == WritingMode.USER_LEAD:
                temperature = 0.3   # Very conservative
            else:
                temperature = 0.7   # Balanced
        else:
            temperature = temperature_override
        
        return {
            "temperature": temperature,
            "top_p": mode_config["top_p"],
            "top_k": mode_config["top_k"],
            "num_predict": max_tokens or settings.max_tokens_per_generation,
        }
    
    async def generate_story_content(
        self,
        prompt: str,
        system_prompt: str,
        writing_mode: WritingMode,
        context: Optional[str] = None,
        max_tokens: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Generate story content based on prompt and mode
        
        Returns:
            Dict with 'content', 'tokens_used', 'generation_time_ms'
        """
        start_time = time.time()
        
        # Build full prompt with system instructions and context
        full_prompt = self._build_full_prompt(system_prompt, context, prompt)
        
        # Get generation options for mode
        generation_options = self._get_generation_options(writing_mode, max_tokens)
        
        try:
            # Call Ollama API
            response = await self.client.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model_name,
                    "prompt": full_prompt,
                    "stream": False,
                    "options": generation_options
                }
            )
            response.raise_for_status()
            result = response.json()
            
            generation_time = int((time.time() - start_time) * 1000)
            
            return {
                "content": result.get("response", ""),
                "tokens_used": result.get("eval_count", 0) + result.get("prompt_eval_count", 0),
                "generation_time_ms": generation_time,
                "model": self.model_name,
                "success": True
            }
            
        except Exception as e:
            logger.error(f"Generation error: {e}")
            return {
                "content": "",
                "error": str(e),
                "success": False,
                "generation_time_ms": int((time.time() - start_time) * 1000)
            }
    
    async def generate_story_content_stream(
        self,
        prompt: str,
        system_prompt: str,
        writing_mode: WritingMode,
        context: Optional[str] = None,
        max_tokens: Optional[int] = None
    ) -> AsyncGenerator[str, None]:
        """
        Generate story content with streaming response
        Yields chunks of text as they are generated
        """
        # Build full prompt with system instructions and context
        full_prompt = self._build_full_prompt(system_prompt, context, prompt)
        
        # Get generation options for mode
        generation_options = self._get_generation_options(writing_mode, max_tokens)
        
        try:
            # Call Ollama API with streaming
            async with self.client.stream(
                "POST",
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model_name,
                    "prompt": full_prompt,
                    "stream": True,
                    "options": generation_options
                }
            ) as response:
                response.raise_for_status()
                async for line in response.aiter_lines():
                    if line:
                        try:
                            data = json.loads(line)
                            if "response" in data:
                                yield data["response"]
                            if data.get("done", False):
                                break
                        except json.JSONDecodeError:
                            continue
                            
        except Exception as e:
            logger.error(f"Streaming generation error: {e}")
            yield f"\n[Error: {str(e)}]"
    
    async def generate_continuation_stream(
        self,
        story_context: str,
        recent_text: str,
        writing_mode: WritingMode,
        style_guide: Optional[str] = None,
        word_count_target: int = 500
    ) -> AsyncGenerator[str, None]:
        """Generate a story continuation with streaming"""
        system_prompt = self._get_continuation_system_prompt(writing_mode, style_guide)
        
        prompt = f"""Continue the following story naturally. Write approximately {word_count_target} words.

STORY CONTEXT:
{story_context}

RECENT TEXT (continue from here):
{recent_text}

Continue the story:"""
        
        async for chunk in self.generate_story_content_stream(
            prompt=prompt,
            system_prompt=system_prompt,
            writing_mode=writing_mode,
            max_tokens=word_count_target * 2
        ):
            yield chunk
    
    async def generate_continuation(
        self,
        story_context: str,
        recent_text: str,
        writing_mode: WritingMode,
        style_guide: Optional[str] = None,
        word_count_target: int = 500
    ) -> Dict[str, Any]:
        """Generate a story continuation"""
        system_prompt = self._get_continuation_system_prompt(writing_mode, style_guide)
        
        prompt = f"""Continue the following story naturally. Write approximately {word_count_target} words.

STORY CONTEXT:
{story_context}

RECENT TEXT (continue from here):
{recent_text}

Continue the story:"""
        
        return await self.generate_story_content(
            prompt=prompt,
            system_prompt=system_prompt,
            writing_mode=writing_mode,
            max_tokens=word_count_target * 2  # Rough token estimate
        )
    
    async def rewrite_text(
        self,
        original_text: str,
        instructions: str,
        writing_mode: WritingMode,
        style_guide: Optional[str] = None
    ) -> Dict[str, Any]:
        """Rewrite text based on instructions"""
        system_prompt = f"""You are an expert editor and rewriter. Your task is to improve text while maintaining 
        the author's voice and intent. {style_guide or ''}"""
        
        prompt = f"""Rewrite the following text according to these instructions:

INSTRUCTIONS: {instructions}

ORIGINAL TEXT:
{original_text}

REWRITTEN VERSION:"""
        
        return await self.generate_story_content(
            prompt=prompt,
            system_prompt=system_prompt,
            writing_mode=writing_mode
        )
    
    async def generate_summary(
        self,
        content: str,
        summary_type: str = "chapter"  # chapter, story, character
    ) -> Dict[str, Any]:
        """Generate a summary of content"""
        type_instructions = {
            "chapter": "Summarize this chapter, highlighting key events, character developments, and plot progressions.",
            "story": "Provide a comprehensive summary of this story so far, including main plot points, character arcs, and themes.",
            "character": "Summarize this character's journey, development, and current state."
        }
        
        system_prompt = """You are an expert at analyzing and summarizing narrative content. 
        Provide clear, concise summaries that capture the essential elements."""
        
        prompt = f"""{type_instructions.get(summary_type, type_instructions["chapter"])}

CONTENT TO SUMMARIZE:
{content}

SUMMARY:"""
        
        return await self.generate_story_content(
            prompt=prompt,
            system_prompt=system_prompt,
            writing_mode=WritingMode.USER_LEAD  # Use precise mode for summaries
        )
    
    async def generate_story_recap(
        self,
        story_summary: str,
        chapters_summary: str,
        characters_state: str,
        plotlines_state: str
    ) -> Dict[str, Any]:
        """Generate a comprehensive story recap"""
        system_prompt = """You are an expert narrative analyst. Provide a clear, organized recap 
        of the story that helps the writer understand where things stand."""
        
        prompt = f"""Generate a comprehensive recap of this story covering:
1. What has happened (major events)
2. Current character states and locations
3. Unresolved plot threads
4. Key themes and motifs

STORY OVERVIEW:
{story_summary}

CHAPTERS SUMMARY:
{chapters_summary}

CHARACTER STATES:
{characters_state}

ACTIVE PLOTLINES:
{plotlines_state}

STORY RECAP:"""
        
        return await self.generate_story_content(
            prompt=prompt,
            system_prompt=system_prompt,
            writing_mode=WritingMode.USER_LEAD
        )
    
    async def analyze_consistency(
        self,
        content: str,
        characters: str,
        world_rules: str,
        previous_events: str
    ) -> Dict[str, Any]:
        """Analyze content for consistency issues"""
        system_prompt = """You are an expert continuity editor. Identify any inconsistencies, 
        contradictions, or violations of established rules in the narrative."""
        
        prompt = f"""Analyze this content for consistency issues:

CONTENT TO ANALYZE:
{content}

ESTABLISHED CHARACTERS:
{characters}

WORLD RULES:
{world_rules}

PREVIOUS EVENTS:
{previous_events}

Identify any issues with:
1. Character behavior inconsistencies
2. Timeline contradictions
3. World rule violations
4. POV consistency
5. Tone drift

CONSISTENCY ANALYSIS:"""
        
        return await self.generate_story_content(
            prompt=prompt,
            system_prompt=system_prompt,
            writing_mode=WritingMode.USER_LEAD,
            max_tokens=1000
        )
    
    async def generate_character_dialogue(
        self,
        character_profile: str,
        scene_context: str,
        dialogue_prompt: str,
        writing_mode: WritingMode
    ) -> Dict[str, Any]:
        """Generate dialogue for a specific character"""
        system_prompt = f"""You are an expert dialogue writer. Write dialogue that perfectly matches 
        the character's voice, background, and personality.
        
CHARACTER PROFILE:
{character_profile}"""
        
        prompt = f"""Write dialogue for this character in the following scene:

SCENE CONTEXT:
{scene_context}

DIALOGUE SITUATION:
{dialogue_prompt}

Write the character's dialogue (and brief action beats if needed):"""
        
        return await self.generate_story_content(
            prompt=prompt,
            system_prompt=system_prompt,
            writing_mode=writing_mode
        )
    
    async def generate_image_prompt(
        self,
        description: str,
        image_type: str,  # character, scene, cover
        style: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate structured image generation prompt"""
        system_prompt = """You are an expert at creating detailed image generation prompts. 
        Create prompts that are vivid, specific, and will produce high-quality images."""
        
        style_guide = style or "cinematic, detailed, high quality, professional"
        
        prompt = f"""Create a detailed image generation prompt for the following:

TYPE: {image_type}
DESCRIPTION: {description}
STYLE: {style_guide}

Create a prompt that includes:
1. Main subject description
2. Composition and framing
3. Lighting and atmosphere
4. Style and artistic direction
5. Technical quality specifications

IMAGE PROMPT:"""
        
        return await self.generate_story_content(
            prompt=prompt,
            system_prompt=system_prompt,
            writing_mode=WritingMode.USER_LEAD,
            max_tokens=500
        )
    
    async def brainstorm_ideas(
        self,
        context: str,
        brainstorm_type: str,  # plot, character, scene, dialogue
        constraints: Optional[str] = None
    ) -> Dict[str, Any]:
        """Brainstorm creative ideas"""
        system_prompt = """You are a creative writing partner. Generate multiple diverse, 
        interesting ideas that could take the story in exciting directions."""
        
        prompt = f"""Brainstorm {brainstorm_type} ideas for this story:

CONTEXT:
{context}

{f"CONSTRAINTS: {constraints}" if constraints else ""}

Generate 5 different creative options, ranging from safe to bold:"""
        
        return await self.generate_story_content(
            prompt=prompt,
            system_prompt=system_prompt,
            writing_mode=WritingMode.AI_LEAD,  # Use creative mode for brainstorming
            max_tokens=1500
        )
    
    async def stream_generation(
        self,
        prompt: str,
        system_prompt: str,
        writing_mode: WritingMode
    ) -> AsyncGenerator[str, None]:
        """Stream generated content chunk by chunk"""
        full_prompt = self._build_full_prompt(system_prompt, None, prompt)
        generation_options = self._get_generation_options(writing_mode)
        
        async with self.client.stream(
            "POST",
            f"{self.base_url}/api/generate",
            json={
                "model": self.model_name,
                "prompt": full_prompt,
                "stream": True,
                "options": generation_options
            },
            timeout=300.0
        ) as response:
            async for line in response.aiter_lines():
                if line.strip():
                    try:
                        chunk = json.loads(line)
                        if "response" in chunk and chunk["response"]:
                            yield chunk["response"]
                    except json.JSONDecodeError:
                        continue
    
    def _build_full_prompt(
        self,
        system_prompt: str,
        context: Optional[str],
        user_prompt: str
    ) -> str:
        """Build the full prompt with all components"""
        parts = [system_prompt]
        
        if context:
            parts.append(f"\n\nCONTEXT:\n{context}")
        
        parts.append(f"\n\n{user_prompt}")
        
        return "\n".join(parts)
    
    def _get_continuation_system_prompt(
        self,
        writing_mode: WritingMode,
        style_guide: Optional[str] = None
    ) -> str:
        """Get system prompt for story continuation based on mode"""
        mode_instructions = {
            WritingMode.AI_LEAD: """You are an autonomous creative writer. Take bold creative decisions, 
            introduce compelling developments, and write with confidence. The user trusts your creative vision.""",
            
            WritingMode.USER_LEAD: """You are a supportive writing assistant. Continue the story following 
            the established direction closely. Don't introduce major new elements unless essential. 
            Match the user's style exactly.""",
            
            WritingMode.CO_AUTHOR: """You are a collaborative co-author. Continue the story thoughtfully, 
            building on what's established while adding your creative input. Balance respecting the user's 
            vision with contributing fresh ideas."""
        }
        
        base_prompt = mode_instructions.get(writing_mode, mode_instructions[WritingMode.CO_AUTHOR])
        
        if style_guide:
            base_prompt += f"\n\nSTYLE GUIDE:\n{style_guide}"
        
        return base_prompt
    
    def _estimate_tokens(self, prompt: str, response: str) -> int:
        """Estimate token count (rough approximation)"""
        # Rough estimate: ~4 characters per token
        total_chars = len(prompt) + len(response)
        return total_chars // 4
    
    async def generate_story_bible(
        self,
        story_content: str,
        story_title: str,
        story_genre: str,
        story_tone: str,
        existing_characters: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Auto-generate Story Bible by analyzing story content
        Extracts world rules, locations, terminology, themes, and more
        """
        system_prompt = """You are an expert story analyst and world-building specialist.
Your task is to analyze story content and extract/infer all world-building elements.

You MUST respond with valid JSON only. No other text before or after the JSON.
Be thorough - extract everything that's explicitly mentioned AND reasonably inferred."""

        prompt = f"""Analyze this {story_genre} story ("{story_title}") and generate a comprehensive Story Bible.

STORY CONTENT:
{story_content}

{f"KNOWN CHARACTERS: {existing_characters}" if existing_characters else ""}

Extract and generate the following as a JSON object:

{{
    "world_name": "Name of the world/setting if mentioned or can be inferred, or null",
    "world_description": "Brief description of the world/setting",
    "world_type": "Type of world (e.g., 'fantasy medieval', 'cyberpunk', 'contemporary', 'space opera')",
    "time_period": "When the story takes place",
    "primary_locations": [
        {{"name": "Location name", "description": "Description", "importance": "high/medium/low"}}
    ],
    "magic_system": "Description of magic/supernatural system if any, or null",
    "magic_rules": ["Rule 1", "Rule 2"],
    "magic_limitations": ["Limitation 1", "Limitation 2"],
    "technology_level": "Technology level description",
    "societies": [
        {{"name": "Society/culture name", "description": "Description", "customs": ["custom1"]}}
    ],
    "world_rules": [
        {{"category": "physics/magic/society/technology/biology", "title": "Rule title", "description": "Rule description", "importance": 1-10}}
    ],
    "central_themes": ["Theme 1", "Theme 2"],
    "recurring_motifs": ["Motif 1", "Motif 2"],
    "glossary": [
        {{"term": "Term", "definition": "Definition"}}
    ],
    "tone_guidelines": "Specific tone/style notes for this story",
    "quick_facts": ["Important fact 1", "Important fact 2"]
}}

Analyze carefully and be comprehensive. For a {story_tone} tone {story_genre} story.
Respond with ONLY the JSON object:"""

        result = await self.generate_story_content(
            prompt=prompt,
            system_prompt=system_prompt,
            writing_mode=WritingMode.USER_LEAD,  # Precise mode for analysis
            max_tokens=3000
        )
        
        if result.get("success"):
            # Try to parse the JSON response
            try:
                content = result["content"].strip()
                # Handle potential markdown code blocks
                if content.startswith("```json"):
                    content = content[7:]
                if content.startswith("```"):
                    content = content[3:]
                if content.endswith("```"):
                    content = content[:-3]
                content = content.strip()
                
                bible_data = json.loads(content)
                result["bible_data"] = bible_data
                result["parsed"] = True
            except json.JSONDecodeError as e:
                logger.warning(f"Failed to parse Story Bible JSON: {e}")
                result["parsed"] = False
                result["parse_error"] = str(e)
        
        return result
    
    async def update_story_bible_from_content(
        self,
        new_content: str,
        existing_bible: Dict[str, Any],
        story_genre: str
    ) -> Dict[str, Any]:
        """
        Update Story Bible incrementally based on new content
        Adds new elements without removing existing ones
        """
        system_prompt = """You are a story analyst updating a Story Bible with new information.
Identify NEW elements that should be added based on the new content.
Only return NEW items, not existing ones.
Respond with valid JSON only."""

        prompt = f"""Analyze this new story content and identify NEW Story Bible elements to add.

NEW CONTENT:
{new_content}

EXISTING STORY BIBLE:
{json.dumps(existing_bible, indent=2)}

Return ONLY NEW elements to add (not duplicates of existing):

{{
    "new_locations": [{{"name": "", "description": "", "importance": ""}}],
    "new_world_rules": [{{"category": "", "title": "", "description": "", "importance": 5}}],
    "new_glossary_terms": [{{"term": "", "definition": ""}}],
    "new_themes": [],
    "new_quick_facts": []
}}

Only include sections that have new items. Respond with JSON only:"""

        result = await self.generate_story_content(
            prompt=prompt,
            system_prompt=system_prompt,
            writing_mode=WritingMode.USER_LEAD,
            max_tokens=1500
        )
        
        if result.get("success"):
            try:
                content = result["content"].strip()
                if content.startswith("```json"):
                    content = content[7:]
                if content.startswith("```"):
                    content = content[3:]
                if content.endswith("```"):
                    content = content[:-3]
                content = content.strip()
                
                updates = json.loads(content)
                result["updates"] = updates
                result["parsed"] = True
            except json.JSONDecodeError as e:
                logger.warning(f"Failed to parse Story Bible update JSON: {e}")
                result["parsed"] = False
        
        return result

