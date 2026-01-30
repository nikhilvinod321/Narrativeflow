"""
Text-to-Speech Service - Using Kokoro-82M (lightweight, fast, high-quality)
"""
import asyncio
import uuid
import base64
import logging
from pathlib import Path
from typing import Optional, Dict, Any
import wave

logger = logging.getLogger(__name__)


class TTSService:
    """
    Text-to-Speech service using Kokoro-82M model.
    Kokoro is a lightweight 82M parameter model that runs fast locally.
    Falls back to Edge TTS (online) if Kokoro fails.
    """
    
    def __init__(self):
        # Get the backend directory path
        self.backend_dir = Path(__file__).parent.parent.parent
        
        self.output_dir = self.backend_dir / 'static' / 'tts_audio'
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Kokoro model paths
        self.kokoro_model_path = self.backend_dir / "kokoro-v1.0.onnx"
        self.kokoro_voices_path = self.backend_dir / "voices-v1.0.bin"
        
        # Kokoro model instance (lazy loaded)
        self._kokoro = None
        
        # Voice mapping for Kokoro
        # Kokoro voice format: af_bella, af_sarah, am_adam, am_michael, bf_emma, etc.
        # a = American, b = British; f = female, m = male
        self.voice_map = {
            "male": "am_adam",      # American male
            "female": "af_bella",    # American female  
            "neutral": "af_sarah",   # American female (neutral)
        }
        
        logger.info(f"TTS Service initialized. Model path: {self.kokoro_model_path}")
    
    async def _init_kokoro(self):
        """Lazily initialize Kokoro model."""
        if self._kokoro is None:
            try:
                from kokoro_onnx import Kokoro
                
                # Check if model files exist
                if not self.kokoro_model_path.exists():
                    logger.error(f"Kokoro model not found at {self.kokoro_model_path}")
                    return
                if not self.kokoro_voices_path.exists():
                    logger.error(f"Kokoro voices not found at {self.kokoro_voices_path}")
                    return
                
                # Run initialization in executor to not block
                loop = asyncio.get_event_loop()
                self._kokoro = await loop.run_in_executor(
                    None,
                    Kokoro,
                    str(self.kokoro_model_path),
                    str(self.kokoro_voices_path)
                )
                logger.info("Kokoro-82M model loaded successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Kokoro: {e}")
                self._kokoro = None
    
    async def check_availability(self) -> Dict[str, Any]:
        """Check TTS availability."""
        backends = []
        
        # Check Kokoro
        try:
            await self._init_kokoro()
            if self._kokoro is not None:
                backends.append("kokoro")
        except Exception as e:
            logger.warning(f"Kokoro not available: {e}")
        
        # Edge TTS is always available as fallback (online)
        try:
            import edge_tts
            backends.append("edge_tts")
        except ImportError:
            pass
        
        return {
            "available": len(backends) > 0,
            "backends": backends,
            "recommended": backends[0] if backends else None
        }
    
    async def generate_speech(
        self,
        text: str,
        voice: str = "neutral",
        speed: float = 1.0,
        backend: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate speech audio from text.
        
        Args:
            text: The text to convert to speech
            voice: Voice type (male, female, neutral)
            speed: Speech speed multiplier (0.5 - 2.0)
            backend: Force specific backend (kokoro, edge_tts)
        
        Returns:
            Dict with audio data and metadata
        """
        # Clean text
        clean_text = self._clean_text(text)
        if not clean_text:
            return {"success": False, "error": "No text to convert"}
        
        # Determine backend
        if backend:
            use_backend = backend
        else:
            availability = await self.check_availability()
            use_backend = availability.get("recommended", "edge_tts")
        
        # Generate audio
        filename = f"{uuid.uuid4()}.wav"
        output_path = self.output_dir / filename
        
        try:
            if use_backend == "kokoro":
                result = await self._generate_with_kokoro(clean_text, voice, speed, output_path)
            elif use_backend == "edge_tts":
                result = await self._generate_with_edge_tts(clean_text, voice, speed, output_path)
            else:
                # Default to edge_tts
                result = await self._generate_with_edge_tts(clean_text, voice, speed, output_path)
            
            if result.get("success"):
                # Get audio duration
                duration = self._get_audio_duration(output_path)
                
                # Read audio and convert to base64
                with open(output_path, "rb") as f:
                    audio_base64 = base64.b64encode(f.read()).decode()
                
                return {
                    "success": True,
                    "audio_path": f"/static/tts_audio/{filename}",
                    "audio_base64": audio_base64,
                    "audio_format": "wav",
                    "duration_seconds": duration,
                    "word_count": len(clean_text.split()),
                    "voice": voice,
                    "speed": speed,
                    "backend_used": use_backend
                }
            else:
                # Try fallback to edge_tts
                if use_backend != "edge_tts":
                    logger.info(f"{use_backend} failed, trying edge_tts fallback")
                    return await self.generate_speech(text, voice, speed, "edge_tts")
                return result
                
        except Exception as e:
            logger.error(f"TTS generation error: {e}")
            # Try fallback
            if use_backend != "edge_tts":
                return await self.generate_speech(text, voice, speed, "edge_tts")
            return {"success": False, "error": str(e)}
    
    def _clean_text(self, text: str) -> str:
        """Clean text for TTS processing."""
        import re
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', '', text)
        # Normalize whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        # Remove problematic characters but keep punctuation
        text = re.sub(r'[^\w\s.,!?;:\'\"-]', '', text)
        return text
    
    async def _generate_with_kokoro(
        self, text: str, voice: str, speed: float, output_path: Path
    ) -> Dict[str, Any]:
        """Generate audio using Kokoro-82M."""
        try:
            await self._init_kokoro()
            
            if self._kokoro is None:
                return {"success": False, "error": "Kokoro model not loaded"}
            
            # Get voice name
            voice_name = self.voice_map.get(voice, self.voice_map["neutral"])
            
            # Generate audio in executor
            loop = asyncio.get_event_loop()
            
            def generate():
                import soundfile as sf
                samples, sample_rate = self._kokoro.create(
                    text,
                    voice=voice_name,
                    speed=speed
                )
                sf.write(str(output_path), samples, sample_rate)
            
            await loop.run_in_executor(None, generate)
            
            if output_path.exists():
                return {"success": True}
            else:
                return {"success": False, "error": "Audio file not created"}
                
        except Exception as e:
            logger.error(f"Kokoro error: {e}")
            return {"success": False, "error": f"Kokoro error: {str(e)}"}
    
    async def _generate_with_edge_tts(
        self, text: str, voice: str, speed: float, output_path: Path
    ) -> Dict[str, Any]:
        """Generate audio using Edge TTS (Microsoft, online fallback)."""
        try:
            import edge_tts
            
            # Map voice preference to Edge TTS voice
            edge_voice_map = {
                "male": "en-US-GuyNeural",
                "female": "en-US-JennyNeural",
                "neutral": "en-US-AriaNeural"
            }
            
            edge_voice = edge_voice_map.get(voice, edge_voice_map["neutral"])
            
            # Convert speed to rate string
            rate_percent = int((speed - 1.0) * 100)
            rate_str = f"+{rate_percent}%" if rate_percent >= 0 else f"{rate_percent}%"
            
            # Edge TTS creates mp3, save it directly
            mp3_path = output_path.with_suffix('.mp3')
            
            communicate = edge_tts.Communicate(text, edge_voice, rate=rate_str)
            await communicate.save(str(mp3_path))
            
            if mp3_path.exists():
                import shutil
                shutil.move(str(mp3_path), str(output_path))
                return {"success": True}
            else:
                return {"success": False, "error": "Edge TTS did not generate audio"}
                
        except ImportError:
            return {"success": False, "error": "Edge TTS not available"}
        except Exception as e:
            logger.error(f"Edge TTS error: {e}")
            return {"success": False, "error": f"Edge TTS error: {str(e)}"}
    
    def _get_audio_duration(self, audio_path: Path) -> float:
        """Get duration of audio file in seconds."""
        try:
            import soundfile as sf
            data, samplerate = sf.read(str(audio_path))
            return len(data) / samplerate
        except Exception:
            try:
                with wave.open(str(audio_path), 'rb') as wav:
                    frames = wav.getnframes()
                    rate = wav.getframerate()
                    return frames / rate
            except Exception:
                try:
                    file_size = audio_path.stat().st_size
                    return file_size / (176 * 1024) * 60
                except:
                    return 0.0
    
    async def get_available_voices(self) -> Dict[str, Any]:
        """Get available voices."""
        voices = [
            {"id": "male", "name": "Male Voice", "description": "Natural male voice"},
            {"id": "female", "name": "Female Voice", "description": "Natural female voice"},
            {"id": "neutral", "name": "Neutral Voice", "description": "Balanced neutral voice"}
        ]
        
        return {
            "voices": voices,
            "default": "neutral"
        }


# Singleton instance
tts_service = TTSService()
