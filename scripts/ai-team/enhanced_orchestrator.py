#!/usr/bin/env python3
"""
SGA QA System - Enhanced AI Team Orchestrator v2.0
=================================================
Integrates LEGITIMATE free API providers for maximum AI compute power.

Providers integrated:
- Google Gemini (paid + free tier - 1.5M tokens/day)
- Groq (free tier - blazing fast, multiple models)
- Cerebras (free tier - fast inference)
- OpenRouter (free tier - many models)
- OpenCode/Grok (your existing accounts)

Author: Claude Code Supervisor
Created: November 2025
"""

import os
import sys
import json
import re
import time
import hashlib
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict, field
from enum import Enum
from abc import ABC, abstractmethod
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

# Load environment variables
from dotenv import load_dotenv
load_dotenv()


# Rich console for pretty output
try:
    from rich.console import Console
    from rich.panel import Panel
    from rich.table import Table
    from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn
    from rich.live import Live
    from rich.layout import Layout
    console = Console()
    RICH_AVAILABLE = True
except ImportError:
    console = None
    RICH_AVAILABLE = False
    print("Note: Install 'rich' for better output: pip install rich")


# ============================================================================
# CONFIGURATION - All Free API Providers
# ============================================================================

class ProviderConfig:
    """Configuration for all free LLM API providers"""
    
    # OpenRouter - Many free models, 50 req/day free tier
    OPENROUTER = {
        "base_url": "https://openrouter.ai/api/v1",
        "free_models": [
            "deepseek/deepseek-r1:free",           # DeepSeek R1 - excellent reasoning
            "deepseek/deepseek-chat-v3-0324:free", # DeepSeek V3 - great coding
            "qwen/qwen-2.5-coder-32b-instruct:free", # Qwen Coder - coding specialist
            "qwen/qwen-2.5-72b-instruct:free",     # Qwen 72B - general purpose
            "meta-llama/llama-3.3-70b-instruct:free", # Llama 3.3 70B
            "meta-llama/llama-4-scout:free",      # Llama 4 Scout (newest)
            "mistralai/mistral-small-3.1-24b-instruct:free", # Mistral Small
            "google/gemma-3-27b-it:free",         # Gemma 3 27B
        ],
        "rate_limit": {"requests_per_day": 50, "requests_per_minute": 20},
    }
    
    # Google Gemini - Very generous free tier
    GEMINI = {
        "base_url": "https://generativelanguage.googleapis.com/v1beta",
        "models": {
            "gemini-2.0-flash": {"rpm": 15, "tpd": 1000000},
            "gemini-2.5-flash": {"rpm": 10, "tpd": 250000},
            "gemini-2.5-pro": {"rpm": 2, "rpd": 50},  # Limited but powerful
        },
    }
    
    # Groq - Extremely fast inference
    GROQ = {
        "base_url": "https://api.groq.com/openai/v1",
        "models": {
            "llama-3.3-70b-versatile": {"rpd": 14400, "tpm": 6000},
            "llama-3.1-8b-instant": {"rpd": 14400, "tpm": 6000},
            "llama-4-scout-17b-16e-instruct": {"rpd": 1000, "tpm": 6000},
            "qwen-qwq-32b": {"rpd": 1000, "tpm": 6000},
            "deepseek-r1-distill-llama-70b": {"rpd": 1000, "tpm": 12000},
        },
    }
    
    # Cerebras - Fast inference, generous limits
    CEREBRAS = {
        "base_url": "https://api.cerebras.ai/v1",
        "models": {
            "llama-3.3-70b": {"rpd": 14400, "tpm": 60000},
            "llama-3.1-8b": {"rpd": 14400, "tpm": 60000},
            "qwen-3-32b": {"rpd": 14400, "tpm": 60000},
            "llama-4-scout": {"rpd": 14400, "tpm": 60000},
        },
    }



# ============================================================================
# ENUMS AND DATA CLASSES
# ============================================================================

class WorkerType(Enum):
    """All available AI workers"""
    # Google
    GEMINI_FLASH = "gemini-flash"
    GEMINI_PRO = "gemini-pro"
    
    # Groq (blazing fast)
    GROQ_LLAMA70B = "groq-llama70b"
    GROQ_LLAMA8B = "groq-llama8b"
    GROQ_DEEPSEEK = "groq-deepseek"
    GROQ_QWQ = "groq-qwq"
    
    # Cerebras (fast)
    CEREBRAS_LLAMA = "cerebras-llama"
    CEREBRAS_QWEN = "cerebras-qwen"
    
    # OpenRouter (many free models)
    OPENROUTER_DEEPSEEK_R1 = "openrouter-deepseek-r1"
    OPENROUTER_DEEPSEEK_V3 = "openrouter-deepseek-v3"
    OPENROUTER_QWEN_CODER = "openrouter-qwen-coder"
    OPENROUTER_LLAMA4 = "openrouter-llama4"
    
    # Legacy (your existing workers)
    OPENCODE_GROK_1 = "opencode-grok-1"
    OPENCODE_GROK_2 = "opencode-grok-2"


class TaskPriority(Enum):
    CRITICAL = 1
    HIGH = 2
    MEDIUM = 3
    LOW = 4


class TaskStatus(Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    RETRYING = "retrying"


@dataclass
class Task:
    """Represents a task to delegate to an AI worker"""
    id: str
    title: str
    description: str
    worker: WorkerType
    context_files: List[str] = field(default_factory=list)
    output_path: str = ""
    success_criteria: List[str] = field(default_factory=list)
    sanitize_data: bool = True
    priority: TaskPriority = TaskPriority.MEDIUM
    status: TaskStatus = TaskStatus.PENDING
    result: Optional[str] = None
    error: Optional[str] = None
    retries: int = 0
    max_retries: int = 3
    fallback_workers: List[WorkerType] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
    tokens_used: int = 0


@dataclass
class WorkerStats:
    """Track worker performance"""
    worker: WorkerType
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    total_tokens: int = 0
    avg_response_time: float = 0.0
    last_used: Optional[datetime] = None
    is_available: bool = True
    rate_limit_reset: Optional[datetime] = None



# ============================================================================
# DATA SANITIZER - Protect secrets from free models
# ============================================================================

class DataSanitizer:
    """
    Sanitizes sensitive data before sending to free models.
    Uses a reversible dictionary approach so code still works.
    """
    
    # Patterns to detect and replace
    PATTERNS = {
        'email': r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',
        'phone': r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',
        'ip_address': r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b',
        'api_key_generic': r'(sk-|AIza|key-|api[_-]?key)[a-zA-Z0-9_-]{20,}',
        'bearer_token': r'Bearer\s+[a-zA-Z0-9_-]{20,}',
        'azure_tenant': r'[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}',
        'sharepoint_url': r'https://[a-zA-Z0-9]+\.sharepoint\.com/[^\s"\']+',
        'connection_string': r'(mongodb|postgres|mysql|redis)://[^\s"\']+',
        'private_key': r'-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----',
        'password_field': r'(password|passwd|pwd)\s*[=:]\s*["\'][^"\']+["\']',
    }
    
    # Company-specific terms to anonymize
    COMPANY_TERMS = {
        'SGA': 'COMPANY',
        'sgagroupcomau': 'tenant',
        'SGAQualityAssurance': 'QASite',
    }
    
    def __init__(self):
        self.redaction_map: Dict[str, str] = {}
        self.reverse_map: Dict[str, str] = {}
        self.counter = 0
    
    def _generate_placeholder(self, pattern_type: str) -> str:
        """Generate a unique placeholder"""
        self.counter += 1
        return f"<{pattern_type.upper()}_{self.counter}>"
    
    def sanitize(self, text: str, level: str = "standard") -> str:
        """
        Sanitize text with reversible placeholders.
        
        Levels:
        - none: No sanitization
        - standard: Redact PII and secrets
        - high: Also anonymize company terms
        """
        if level == "none":
            return text
        
        result = text
        
        # Replace patterns with unique placeholders
        for pattern_name, pattern in self.PATTERNS.items():
            matches = re.findall(pattern, result, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple):
                    match = match[0]
                if match not in self.redaction_map:
                    placeholder = self._generate_placeholder(pattern_name)
                    self.redaction_map[match] = placeholder
                    self.reverse_map[placeholder] = match
                result = result.replace(match, self.redaction_map[match])
        
        # High security: also anonymize company terms
        if level == "high":
            for term, replacement in self.COMPANY_TERMS.items():
                result = result.replace(term, replacement)
        
        return result
    
    def restore(self, text: str) -> str:
        """Restore original values from placeholders"""
        result = text
        for placeholder, original in self.reverse_map.items():
            result = result.replace(placeholder, original)
        return result
    
    def get_redaction_report(self) -> Dict[str, int]:
        """Get a count of redacted items by type"""
        report = {}
        for placeholder in self.reverse_map.keys():
            pattern_type = placeholder.split('_')[0].strip('<>')
            report[pattern_type] = report.get(pattern_type, 0) + 1
        return report



# ============================================================================
# BASE WORKER CLASS
# ============================================================================

class AIWorker(ABC):
    """Abstract base class for all AI workers"""
    
    def __init__(self, worker_type: WorkerType):
        self.worker_type = worker_type
        self.stats = WorkerStats(worker=worker_type)
        self.client = None
        self.model = None
        self._setup()
    
    @abstractmethod
    def _setup(self):
        """Setup API client"""
        pass
    
    @abstractmethod
    def execute(self, prompt: str, system_prompt: str = None) -> Tuple[str, int]:
        """Execute prompt, return (response, tokens_used)"""
        pass
    
    def is_available(self) -> bool:
        """Check if worker is available (not rate limited)"""
        if self.stats.rate_limit_reset:
            if datetime.now() < self.stats.rate_limit_reset:
                return False
            self.stats.rate_limit_reset = None
        return self.stats.is_available
    
    def record_success(self, tokens: int, response_time: float):
        """Record successful request"""
        self.stats.total_requests += 1
        self.stats.successful_requests += 1
        self.stats.total_tokens += tokens
        self.stats.last_used = datetime.now()
        # Update rolling average
        n = self.stats.successful_requests
        self.stats.avg_response_time = (
            (self.stats.avg_response_time * (n - 1) + response_time) / n
        )
    
    def record_failure(self, error: str):
        """Record failed request"""
        self.stats.total_requests += 1
        self.stats.failed_requests += 1
        self.stats.last_used = datetime.now()
        
        # Check for rate limit errors
        if "rate" in error.lower() or "429" in error:
            self.stats.rate_limit_reset = datetime.now() + timedelta(minutes=1)


# ============================================================================
# GEMINI WORKER (Google AI - Very generous free tier)
# ============================================================================

class GeminiWorker(AIWorker):
    """Google Gemini worker - 1M+ tokens/day free"""
    
    MODEL_MAP = {
        WorkerType.GEMINI_FLASH: "gemini-2.0-flash",
        WorkerType.GEMINI_PRO: "gemini-2.5-pro-preview-05-06",
    }
    
    def _setup(self):
        try:
            import google.generativeai as genai
            api_key = os.getenv("GOOGLE_API_KEY")
            if not api_key:
                raise ValueError("GOOGLE_API_KEY not set")
            genai.configure(api_key=api_key)
            self.genai = genai
            self.model_name = self.MODEL_MAP.get(self.worker_type, "gemini-2.0-flash")
        except ImportError:
            raise ImportError("Install google-generativeai: pip install google-generativeai")
    
    def execute(self, prompt: str, system_prompt: str = None) -> Tuple[str, int]:
        start_time = time.time()
        try:
            model = self.genai.GenerativeModel(
                self.model_name,
                system_instruction=system_prompt or "You are an expert software developer."
            )
            response = model.generate_content(prompt)
            elapsed = time.time() - start_time
            
            # Estimate tokens (Gemini doesn't always provide exact count)
            tokens = len(prompt.split()) + len(response.text.split())
            self.record_success(tokens, elapsed)
            
            return response.text, tokens
        except Exception as e:
            self.record_failure(str(e))
            raise



from datetime import timedelta

# ============================================================================
# GROQ WORKER (Blazing fast inference)
# ============================================================================

class GroqWorker(AIWorker):
    """Groq worker - Extremely fast, generous free tier"""
    
    MODEL_MAP = {
        WorkerType.GROQ_LLAMA70B: "llama-3.3-70b-versatile",
        WorkerType.GROQ_LLAMA8B: "llama-3.1-8b-instant",
        WorkerType.GROQ_DEEPSEEK: "deepseek-r1-distill-llama-70b",
        WorkerType.GROQ_QWQ: "qwen-qwq-32b",
    }
    
    def _setup(self):
        from openai import OpenAI
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not set. Get free key at: https://console.groq.com")
        self.client = OpenAI(
            api_key=api_key,
            base_url="https://api.groq.com/openai/v1"
        )
        self.model = self.MODEL_MAP.get(self.worker_type, "llama-3.3-70b-versatile")
    
    def execute(self, prompt: str, system_prompt: str = None) -> Tuple[str, int]:
        start_time = time.time()
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt or "You are an expert software developer."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=8192,
                temperature=0.7
            )
            elapsed = time.time() - start_time
            tokens = response.usage.total_tokens if response.usage else 0
            self.record_success(tokens, elapsed)
            return response.choices[0].message.content, tokens
        except Exception as e:
            self.record_failure(str(e))
            raise


# ============================================================================
# CEREBRAS WORKER (Fast inference, very generous limits)
# ============================================================================

class CerebrasWorker(AIWorker):
    """Cerebras worker - Fast inference with generous free tier"""
    
    MODEL_MAP = {
        WorkerType.CEREBRAS_LLAMA: "llama-3.3-70b",
        WorkerType.CEREBRAS_QWEN: "qwen-3-32b",
    }
    
    def _setup(self):
        from openai import OpenAI
        api_key = os.getenv("CEREBRAS_API_KEY")
        if not api_key:
            raise ValueError("CEREBRAS_API_KEY not set. Get free key at: https://cloud.cerebras.ai")
        self.client = OpenAI(
            api_key=api_key,
            base_url="https://api.cerebras.ai/v1"
        )
        self.model = self.MODEL_MAP.get(self.worker_type, "llama-3.3-70b")
    
    def execute(self, prompt: str, system_prompt: str = None) -> Tuple[str, int]:
        start_time = time.time()
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt or "You are an expert software developer."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=8192,
                temperature=0.7
            )
            elapsed = time.time() - start_time
            tokens = response.usage.total_tokens if response.usage else 0
            self.record_success(tokens, elapsed)
            return response.choices[0].message.content, tokens
        except Exception as e:
            self.record_failure(str(e))
            raise



# ============================================================================
# OPENROUTER WORKER (Many free models, single API)
# ============================================================================

class OpenRouterWorker(AIWorker):
    """OpenRouter worker - Access to many free models via single API"""
    
    MODEL_MAP = {
        WorkerType.OPENROUTER_DEEPSEEK_R1: "deepseek/deepseek-r1:free",
        WorkerType.OPENROUTER_DEEPSEEK_V3: "deepseek/deepseek-chat-v3-0324:free",
        WorkerType.OPENROUTER_QWEN_CODER: "qwen/qwen-2.5-coder-32b-instruct:free",
        WorkerType.OPENROUTER_LLAMA4: "meta-llama/llama-4-scout:free",
    }
    
    def __init__(self, worker_type: WorkerType, account_num: int = 1):
        self.account_num = account_num
        super().__init__(worker_type)
    
    def _setup(self):
        from openai import OpenAI
        key_name = f"OPENROUTER_API_KEY_{self.account_num}"
        api_key = os.getenv(key_name) or os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            raise ValueError(f"{key_name} not set. Get free key at: https://openrouter.ai")
        self.client = OpenAI(
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1"
        )
        self.model = self.MODEL_MAP.get(self.worker_type, "deepseek/deepseek-chat-v3-0324:free")
    
    def execute(self, prompt: str, system_prompt: str = None) -> Tuple[str, int]:
        start_time = time.time()
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt or "You are an expert software developer."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=8192,
                temperature=0.7,
                extra_headers={
                    "HTTP-Referer": "https://sga-qa-system.vercel.app",
                    "X-Title": "SGA QA System"
                }
            )
            elapsed = time.time() - start_time
            tokens = response.usage.total_tokens if response.usage else 0
            self.record_success(tokens, elapsed)
            return response.choices[0].message.content, tokens
        except Exception as e:
            self.record_failure(str(e))
            raise



# ============================================================================
# OPENCODE (GROK) WORKER - Your existing workers
# ============================================================================

class OpenCodeWorker(AIWorker):
    """OpenCode (Grok) worker - Your existing accounts"""
    
    def __init__(self, worker_type: WorkerType, account_num: int = 1):
        self.account_num = account_num
        super().__init__(worker_type)
    
    def _setup(self):
        from openai import OpenAI
        key_name = f"OPENCODE_API_KEY_{self.account_num}"
        # Also check legacy key names
        api_key = os.getenv(key_name) or os.getenv("OPENCODE_API_KEY")
        if not api_key:
            raise ValueError(f"{key_name} not set")
        self.client = OpenAI(
            api_key=api_key,
            base_url="https://api.opencode.ai/v1"
        )
        self.model = "x-ai/grok-code-fast-1"
    
    def execute(self, prompt: str, system_prompt: str = None) -> Tuple[str, int]:
        start_time = time.time()
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt or "You are Grok, an expert software developer."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=4096,
                temperature=0.7
            )
            elapsed = time.time() - start_time
            tokens = response.usage.total_tokens if response.usage else 0
            self.record_success(tokens, elapsed)
            return response.choices[0].message.content, tokens
        except Exception as e:
            self.record_failure(str(e))
            raise


# ============================================================================
# WORKER FACTORY
# ============================================================================

class WorkerFactory:
    """Factory to create and manage workers"""
    
    @staticmethod
    def create_worker(worker_type: WorkerType) -> Optional[AIWorker]:
        """Create a worker instance"""
        try:
            # Gemini workers
            if worker_type in [WorkerType.GEMINI_FLASH, WorkerType.GEMINI_PRO]:
                return GeminiWorker(worker_type)
            
            # Groq workers
            if worker_type in [WorkerType.GROQ_LLAMA70B, WorkerType.GROQ_LLAMA8B, 
                               WorkerType.GROQ_DEEPSEEK, WorkerType.GROQ_QWQ]:
                return GroqWorker(worker_type)
            
            # Cerebras workers
            if worker_type in [WorkerType.CEREBRAS_LLAMA, WorkerType.CEREBRAS_QWEN]:
                return CerebrasWorker(worker_type)
            
            # OpenRouter workers
            if worker_type in [WorkerType.OPENROUTER_DEEPSEEK_R1, WorkerType.OPENROUTER_DEEPSEEK_V3,
                               WorkerType.OPENROUTER_QWEN_CODER, WorkerType.OPENROUTER_LLAMA4]:
                return OpenRouterWorker(worker_type)
            
            # OpenCode (Grok) workers
            if worker_type == WorkerType.OPENCODE_GROK_1:
                return OpenCodeWorker(worker_type, account_num=1)
            if worker_type == WorkerType.OPENCODE_GROK_2:
                return OpenCodeWorker(worker_type, account_num=2)
            
            return None
        except Exception as e:
            print(f"  ⚠ Failed to create {worker_type.value}: {e}")
            return None



# ============================================================================
# LOAD BALANCER - Distributes tasks across workers
# ============================================================================

class LoadBalancer:
    """
    Intelligent load balancer for distributing tasks across workers.
    
    Strategies:
    - Round-robin: Distribute evenly across workers
    - Least-loaded: Send to worker with fewest pending tasks
    - Best-fit: Match task type to best worker
    - Failover: Automatically retry with fallback workers
    """
    
    def __init__(self, workers: Dict[WorkerType, AIWorker]):
        self.workers = workers
        self.task_counts: Dict[WorkerType, int] = {w: 0 for w in workers}
        self.round_robin_index = 0
    
    def get_available_workers(self) -> List[WorkerType]:
        """Get list of available workers"""
        return [w for w, worker in self.workers.items() if worker.is_available()]
    
    def select_worker_round_robin(self, preferred_types: List[WorkerType] = None) -> Optional[WorkerType]:
        """Select worker using round-robin strategy"""
        available = self.get_available_workers()
        if preferred_types:
            available = [w for w in available if w in preferred_types]
        if not available:
            return None
        
        self.round_robin_index = (self.round_robin_index + 1) % len(available)
        return available[self.round_robin_index]
    
    def select_worker_least_loaded(self, preferred_types: List[WorkerType] = None) -> Optional[WorkerType]:
        """Select worker with fewest pending tasks"""
        available = self.get_available_workers()
        if preferred_types:
            available = [w for w in available if w in preferred_types]
        if not available:
            return None
        
        return min(available, key=lambda w: self.task_counts[w])
    
    def select_worker_best_fit(self, task: Task) -> Optional[WorkerType]:
        """Select best worker for the task based on task type"""
        
        # Coding tasks -> Qwen Coder or DeepSeek
        coding_keywords = ["code", "implement", "function", "class", "react", "typescript"]
        if any(kw in task.description.lower() for kw in coding_keywords):
            preferred = [
                WorkerType.OPENROUTER_QWEN_CODER,
                WorkerType.GROQ_DEEPSEEK,
                WorkerType.CEREBRAS_QWEN,
                WorkerType.GEMINI_FLASH,
            ]
        
        # Reasoning tasks -> DeepSeek R1 or QwQ
        elif any(kw in task.description.lower() for kw in ["analyze", "reason", "complex", "algorithm"]):
            preferred = [
                WorkerType.OPENROUTER_DEEPSEEK_R1,
                WorkerType.GROQ_QWQ,
                WorkerType.GEMINI_PRO,
            ]
        
        # Fast tasks -> Groq
        elif task.priority == TaskPriority.CRITICAL:
            preferred = [
                WorkerType.GROQ_LLAMA8B,
                WorkerType.CEREBRAS_LLAMA,
                WorkerType.GEMINI_FLASH,
            ]
        
        # General tasks
        else:
            preferred = [
                WorkerType.GROQ_LLAMA70B,
                WorkerType.CEREBRAS_LLAMA,
                WorkerType.OPENROUTER_DEEPSEEK_V3,
                WorkerType.GEMINI_FLASH,
            ]
        
        # Filter to available workers
        available = [w for w in preferred if w in self.workers and self.workers[w].is_available()]
        
        if available:
            return available[0]
        
        # Fallback to any available worker
        return self.select_worker_least_loaded()
    
    def record_task_assigned(self, worker_type: WorkerType):
        """Record that a task was assigned"""
        self.task_counts[worker_type] = self.task_counts.get(worker_type, 0) + 1
    
    def record_task_completed(self, worker_type: WorkerType):
        """Record that a task was completed"""
        self.task_counts[worker_type] = max(0, self.task_counts.get(worker_type, 1) - 1)



# ============================================================================
# MAIN ORCHESTRATOR
# ============================================================================

class EnhancedOrchestrator:
    """
    Main orchestrator that coordinates AI workers.
    
    Features:
    - Multiple provider support (Gemini, Groq, Cerebras, OpenRouter, etc.)
    - Intelligent load balancing
    - Automatic failover and retries
    - Data sanitization for security
    - Parallel task execution
    - Comprehensive logging
    """
    
    def __init__(self, project_dir: str):
        self.project_dir = project_dir
        self.output_dir = os.path.join(project_dir, "ai_team_output")
        self.workers: Dict[WorkerType, AIWorker] = {}
        self.sanitizer = DataSanitizer()
        self.task_queue: List[Task] = []
        self.completed_tasks: List[Task] = []
        self.failed_tasks: List[Task] = []
        self.load_balancer: Optional[LoadBalancer] = None
        
        self._setup_directories()
        self._initialize_workers()
    
    def _setup_directories(self):
        """Create necessary output directories"""
        dirs = [
            self.output_dir,
            os.path.join(self.output_dir, "deliverables"),
            os.path.join(self.output_dir, "logs"),
            os.path.join(self.output_dir, "reviews"),
        ]
        for d in dirs:
            os.makedirs(d, exist_ok=True)
    
    def _initialize_workers(self):
        """Initialize all available AI workers"""
        if RICH_AVAILABLE:
            console.print("\n[bold blue]🤖 Initializing AI Workers...[/bold blue]")
        else:
            print("\n🤖 Initializing AI Workers...")
        
        # All worker types to try
        all_workers = list(WorkerType)
        
        success_count = 0
        for worker_type in all_workers:
            worker = WorkerFactory.create_worker(worker_type)
            if worker:
                self.workers[worker_type] = worker
                success_count += 1
                if RICH_AVAILABLE:
                    console.print(f"  [green]✓[/green] {worker_type.value}")
                else:
                    print(f"  ✓ {worker_type.value}")
        
        if success_count == 0:
            print("\n⚠ No workers initialized! Please set up API keys.")
            self._print_api_key_help()
        else:
            self.load_balancer = LoadBalancer(self.workers)
            print(f"\n✅ {success_count}/{len(all_workers)} workers initialized")
    
    def _print_api_key_help(self):
        """Print help for setting up API keys"""
        help_text = """
╔══════════════════════════════════════════════════════════════════════╗
║                    FREE API KEY SETUP GUIDE                          ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  Add these to your .env file:                                        ║
║                                                                      ║
║  # Google Gemini (1M+ tokens/day FREE)                               ║
║  GOOGLE_API_KEY=your_key_here                                        ║
║  Get key: https://aistudio.google.com/apikey                         ║
║                                                                      ║
║  # Groq (BLAZING FAST, generous free tier)                           ║
║  GROQ_API_KEY=your_key_here                                          ║
║  Get key: https://console.groq.com                                   ║
║                                                                      ║
║  # Cerebras (Fast inference, generous limits)                        ║
║  CEREBRAS_API_KEY=your_key_here                                      ║
║  Get key: https://cloud.cerebras.ai                                  ║
║                                                                      ║
║  # OpenRouter (Many free models)                                     ║
║  OPENROUTER_API_KEY=your_key_here                                    ║
║  Get key: https://openrouter.ai/keys                                 ║
║                                                                      ║
║  # Your existing OpenCode (Grok) keys                                ║
║  OPENCODE_API_KEY_1=your_key_here                                    ║
║  OPENCODE_API_KEY_2=your_key_here                                    ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
"""
        print(help_text)
    
    def add_task(self, task: Task):
        """Add a task to the queue"""
        self.task_queue.append(task)
        self.task_queue.sort(key=lambda t: t.priority.value)
    
    def _build_context(self, task: Task) -> str:
        """Build context from files for a task"""
        context_parts = []
        for file_path in task.context_files:
            full_path = os.path.join(self.project_dir, file_path) if not os.path.isabs(file_path) else file_path
            if os.path.exists(full_path):
                try:
                    with open(full_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    # Truncate very large files
                    if len(content) > 50000:
                        content = content[:25000] + "\n\n... [truncated] ...\n\n" + content[-25000:]
                    context_parts.append(f"### File: {os.path.basename(file_path)}\n```\n{content}\n```\n")
                except Exception as e:
                    context_parts.append(f"### File: {file_path}\n[Error reading: {e}]\n")
        return "\n".join(context_parts)
    

    def execute_task(self, task: Task, worker_override: WorkerType = None) -> bool:
        """Execute a single task"""
        
        # Select worker
        if worker_override:
            worker_type = worker_override
        elif self.load_balancer:
            worker_type = self.load_balancer.select_worker_best_fit(task)
        else:
            worker_type = task.worker
        
        if not worker_type or worker_type not in self.workers:
            task.error = f"No available worker for task"
            task.status = TaskStatus.FAILED
            return False
        
        worker = self.workers[worker_type]
        
        # Build prompt
        context = self._build_context(task)
        prompt = f"""# Task: {task.title}

## Description
{task.description}

## Context Files
{context if context else "No context files provided."}

## Success Criteria
{chr(10).join(f'- {c}' for c in task.success_criteria)}

## Instructions
Please complete this task and provide:
1. The complete code/solution
2. Brief explanation of your approach
3. Any assumptions made

Respond with well-formatted, production-ready code.
"""
        
        # Sanitize if needed
        if task.sanitize_data:
            prompt = self.sanitizer.sanitize(prompt)
            redaction_report = self.sanitizer.get_redaction_report()
            if redaction_report:
                print(f"  🔒 Redacted: {redaction_report}")
        
        # Execute
        task.status = TaskStatus.IN_PROGRESS
        if self.load_balancer:
            self.load_balancer.record_task_assigned(worker_type)
        
        try:
            result, tokens = worker.execute(prompt)
            
            # Restore redacted values in result
            if task.sanitize_data:
                result = self.sanitizer.restore(result)
            
            task.result = result
            task.tokens_used = tokens
            task.status = TaskStatus.COMPLETED
            task.completed_at = datetime.now()
            
            # Save result to file
            self._save_task_result(task, worker_type)
            
            if self.load_balancer:
                self.load_balancer.record_task_completed(worker_type)
            
            return True
            
        except Exception as e:
            task.error = str(e)
            task.retries += 1
            
            if self.load_balancer:
                self.load_balancer.record_task_completed(worker_type)
            
            # Try fallback workers
            if task.retries < task.max_retries and task.fallback_workers:
                for fallback in task.fallback_workers:
                    if fallback in self.workers and self.workers[fallback].is_available():
                        print(f"  ↻ Retrying with {fallback.value}...")
                        task.status = TaskStatus.RETRYING
                        return self.execute_task(task, worker_override=fallback)
            
            task.status = TaskStatus.FAILED
            return False
    
    def _save_task_result(self, task: Task, worker_type: WorkerType):
        """Save task result to file"""
        output_file = os.path.join(self.output_dir, "deliverables", f"{task.id}.md")
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(f"# Task: {task.title}\n\n")
            f.write(f"**ID:** {task.id}\n")
            f.write(f"**Worker:** {worker_type.value}\n")
            f.write(f"**Status:** {task.status.value}\n")
            f.write(f"**Tokens Used:** {task.tokens_used}\n")
            f.write(f"**Completed:** {task.completed_at.isoformat() if task.completed_at else 'N/A'}\n\n")
            f.write("---\n\n")
            f.write("## Result\n\n")
            f.write(task.result or "No result")
    
    def run_all_tasks(self, parallel: bool = False, max_workers: int = 3):
        """Execute all tasks in the queue"""
        
        print(f"\n{'='*60}")
        print(f"🚀 Executing {len(self.task_queue)} tasks...")
        print(f"{'='*60}\n")
        
        if parallel and len(self.task_queue) > 1:
            self._run_parallel(max_workers)
        else:
            self._run_sequential()
        
        # Generate summary
        self._generate_summary()
    

    def _run_sequential(self):
        """Run tasks sequentially"""
        for i, task in enumerate(self.task_queue):
            print(f"\n[{i+1}/{len(self.task_queue)}] {task.title}")
            print(f"  Priority: {task.priority.name}")
            
            success = self.execute_task(task)
            
            if success:
                print(f"  [green]✓ Completed[/green]" if RICH_AVAILABLE else "  ✓ Completed")
                self.completed_tasks.append(task)
            else:
                print(f"  [red]✗ Failed: {task.error[:100]}...[/red]" if RICH_AVAILABLE else f"  ✗ Failed: {task.error[:100]}...")
                self.failed_tasks.append(task)
    
    def _run_parallel(self, max_workers: int):
        """Run tasks in parallel using thread pool"""
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {executor.submit(self.execute_task, task): task for task in self.task_queue}
            
            for future in as_completed(futures):
                task = futures[future]
                try:
                    success = future.result()
                    if success:
                        print(f"  ✓ {task.title} completed")
                        self.completed_tasks.append(task)
                    else:
                        print(f"  ✗ {task.title} failed")
                        self.failed_tasks.append(task)
                except Exception as e:
                    print(f"  ✗ {task.title} error: {e}")
                    task.error = str(e)
                    task.status = TaskStatus.FAILED
                    self.failed_tasks.append(task)
    
    def _generate_summary(self):
        """Generate execution summary"""
        
        total_tokens = sum(t.tokens_used for t in self.completed_tasks)
        
        summary = {
            "timestamp": datetime.now().isoformat(),
            "total_tasks": len(self.task_queue),
            "completed": len(self.completed_tasks),
            "failed": len(self.failed_tasks),
            "total_tokens": total_tokens,
            "workers_used": list(set(str(w) for w in self.workers.keys())),
            "tasks": [
                {
                    "id": t.id,
                    "title": t.title,
                    "status": t.status.value,
                    "tokens": t.tokens_used,
                    "error": t.error
                }
                for t in self.task_queue
            ]
        }
        
        # Save summary
        summary_file = os.path.join(
            self.output_dir, "logs", 
            f"summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        )
        with open(summary_file, 'w') as f:
            json.dump(summary, f, indent=2, default=str)
        
        # Print summary
        print(f"\n{'='*60}")
        print("📊 EXECUTION SUMMARY")
        print(f"{'='*60}")
        print(f"  Total Tasks:     {summary['total_tasks']}")
        print(f"  Completed:       {summary['completed']}")
        print(f"  Failed:          {summary['failed']}")
        print(f"  Total Tokens:    {total_tokens:,}")
        print(f"  Summary File:    {summary_file}")
        print(f"{'='*60}\n")
        
        # Print worker stats
        print("🤖 WORKER STATISTICS")
        print("-" * 60)
        for worker_type, worker in self.workers.items():
            stats = worker.stats
            if stats.total_requests > 0:
                success_rate = (stats.successful_requests / stats.total_requests) * 100
                print(f"  {worker_type.value}:")
                print(f"    Requests: {stats.total_requests} ({success_rate:.1f}% success)")
                print(f"    Tokens:   {stats.total_tokens:,}")
                print(f"    Avg Time: {stats.avg_response_time:.2f}s")
    
    def get_worker_status(self) -> Dict[str, Any]:
        """Get status of all workers"""
        status = {}
        for worker_type, worker in self.workers.items():
            status[worker_type.value] = {
                "available": worker.is_available(),
                "total_requests": worker.stats.total_requests,
                "success_rate": (
                    worker.stats.successful_requests / worker.stats.total_requests * 100
                    if worker.stats.total_requests > 0 else 0
                ),
                "tokens_used": worker.stats.total_tokens,
            }
        return status



# ============================================================================
# TASK TEMPLATES - Pre-built tasks for common operations
# ============================================================================

class TaskTemplates:
    """Pre-built task templates for common operations"""
    
    @staticmethod
    def create_react_component(
        component_name: str,
        description: str,
        context_files: List[str] = None
    ) -> Task:
        """Create a task for building a React component"""
        return Task(
            id=f"REACT_{component_name.upper()}",
            title=f"Create React Component: {component_name}",
            description=f"""Create a React TypeScript component for: {description}

Requirements:
- Use TypeScript with proper types
- Use Tailwind CSS for styling
- Follow existing project patterns
- Include proper error handling
- Be mobile-responsive (iPad-first)
- Include loading states where appropriate
""",
            worker=WorkerType.OPENROUTER_QWEN_CODER,
            context_files=context_files or [],
            output_path=f"src/components/{component_name}.tsx",
            success_criteria=[
                "Component compiles without TypeScript errors",
                "Uses Tailwind CSS for styling",
                "Includes proper prop types",
                "Handles loading and error states"
            ],
            fallback_workers=[
                WorkerType.GROQ_DEEPSEEK,
                WorkerType.TOGETHER_QWEN,
                WorkerType.GEMINI_FLASH
            ]
        )
    
    @staticmethod
    def create_api_endpoint(
        endpoint_name: str,
        description: str,
        context_files: List[str] = None
    ) -> Task:
        """Create a task for building an API endpoint"""
        return Task(
            id=f"API_{endpoint_name.upper()}",
            title=f"Create API Endpoint: {endpoint_name}",
            description=f"""Create a Vercel serverless API endpoint for: {description}

Requirements:
- TypeScript with proper types
- Input validation
- Error handling with proper HTTP status codes
- Use existing Dataverse/SharePoint patterns from the project
- Include proper authentication checks
""",
            worker=WorkerType.GROQ_LLAMA70B,
            context_files=context_files or [],
            output_path=f"api/{endpoint_name}.ts",
            success_criteria=[
                "Endpoint compiles without errors",
                "Includes input validation",
                "Proper error handling",
                "Uses project patterns"
            ],
            fallback_workers=[
                WorkerType.CEREBRAS_LLAMA,
                WorkerType.OPENROUTER_DEEPSEEK_V3
            ]
        )
    
    @staticmethod
    def code_review(
        file_path: str,
        focus_areas: List[str] = None
    ) -> Task:
        """Create a task for code review"""
        focus = focus_areas or ["bugs", "performance", "security", "best practices"]
        return Task(
            id=f"REVIEW_{hashlib.md5(file_path.encode()).hexdigest()[:8]}",
            title=f"Code Review: {os.path.basename(file_path)}",
            description=f"""Review the following code for:
{chr(10).join(f'- {f}' for f in focus)}

Provide:
1. List of issues found (with line numbers if possible)
2. Suggested fixes
3. Overall quality assessment
""",
            worker=WorkerType.OPENROUTER_DEEPSEEK_R1,  # Good at reasoning
            context_files=[file_path],
            success_criteria=[
                "Identifies potential issues",
                "Provides actionable suggestions",
                "Clear and organized output"
            ],
            fallback_workers=[
                WorkerType.GROQ_QWQ,
                WorkerType.GEMINI_PRO
            ]
        )



# ============================================================================
# CLI INTERFACE
# ============================================================================

def print_banner():
    """Print the banner"""
    banner = """
╔══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║   ███████╗ ██████╗  █████╗      █████╗ ██╗    ████████╗███████╗ █████╗ ███╗  ║
║   ██╔════╝██╔════╝ ██╔══██╗    ██╔══██╗██║    ╚══██╔══╝██╔════╝██╔══██╗████╗ ║
║   ███████╗██║  ███╗███████║    ███████║██║       ██║   █████╗  ███████║██╔██╗║
║   ╚════██║██║   ██║██╔══██║    ██╔══██║██║       ██║   ██╔══╝  ██╔══██║██║╚██║
║   ███████║╚██████╔╝██║  ██║    ██║  ██║██║       ██║   ███████╗██║  ██║██║ ╚█║
║   ╚══════╝ ╚═════╝ ╚═╝  ╚═╝    ╚═╝  ╚═╝╚═╝       ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝  ║
║                                                                              ║
║            Enhanced AI Team Orchestrator v2.0                                ║
║            Powered by: Gemini • Groq • Cerebras • OpenRouter                 ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""
    print(banner)


def interactive_mode(orchestrator: EnhancedOrchestrator):
    """Run in interactive mode"""
    print("\n📝 Interactive Mode")
    print("Commands: add, run, status, help, quit\n")
    
    while True:
        try:
            cmd = input("ai-team> ").strip().lower()
            
            if cmd == "quit" or cmd == "exit":
                print("👋 Goodbye!")
                break
            
            elif cmd == "help":
                print("""
Available commands:
  add       - Add a new task
  run       - Run all queued tasks
  status    - Show worker status
  queue     - Show task queue
  clear     - Clear task queue
  help      - Show this help
  quit      - Exit
""")
            
            elif cmd == "status":
                status = orchestrator.get_worker_status()
                print("\n🤖 Worker Status:")
                for worker, info in status.items():
                    avail = "✓" if info["available"] else "✗"
                    print(f"  [{avail}] {worker}: {info['total_requests']} requests, {info['tokens_used']:,} tokens")
            
            elif cmd == "queue":
                if orchestrator.task_queue:
                    print(f"\n📋 Task Queue ({len(orchestrator.task_queue)} tasks):")
                    for i, task in enumerate(orchestrator.task_queue):
                        print(f"  {i+1}. [{task.priority.name}] {task.title}")
                else:
                    print("  Queue is empty")
            
            elif cmd == "run":
                if orchestrator.task_queue:
                    orchestrator.run_all_tasks()
                else:
                    print("  No tasks in queue")
            
            elif cmd == "clear":
                orchestrator.task_queue.clear()
                print("  Queue cleared")
            
            elif cmd == "add":
                print("  Task types: component, api, review, custom")
                task_type = input("  Type: ").strip().lower()
                
                if task_type == "component":
                    name = input("  Component name: ").strip()
                    desc = input("  Description: ").strip()
                    task = TaskTemplates.create_react_component(name, desc)
                    orchestrator.add_task(task)
                    print(f"  ✓ Added task: {task.title}")
                
                elif task_type == "api":
                    name = input("  Endpoint name: ").strip()
                    desc = input("  Description: ").strip()
                    task = TaskTemplates.create_api_endpoint(name, desc)
                    orchestrator.add_task(task)
                    print(f"  ✓ Added task: {task.title}")
                
                elif task_type == "review":
                    path = input("  File path: ").strip()
                    task = TaskTemplates.code_review(path)
                    orchestrator.add_task(task)
                    print(f"  ✓ Added task: {task.title}")
                
                elif task_type == "custom":
                    print("  Creating custom task...")
                    task_id = input("  Task ID: ").strip()
                    title = input("  Title: ").strip()
                    desc = input("  Description: ").strip()
                    task = Task(
                        id=task_id,
                        title=title,
                        description=desc,
                        worker=WorkerType.GROQ_LLAMA70B,
                        fallback_workers=[
                            WorkerType.CEREBRAS_LLAMA,
                            WorkerType.GEMINI_FLASH
                        ]
                    )
                    orchestrator.add_task(task)
                    print(f"  ✓ Added task: {task.title}")
            
            else:
                print(f"  Unknown command: {cmd}. Type 'help' for commands.")
                
        except KeyboardInterrupt:
            print("\n  Use 'quit' to exit")
        except Exception as e:
            print(f"  Error: {e}")



# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

def main():
    """Main entry point"""
    print_banner()
    
    # Detect project directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.dirname(os.path.dirname(script_dir))
    
    print(f"📁 Project: {project_dir}")
    
    # Initialize orchestrator
    orchestrator = EnhancedOrchestrator(project_dir)
    
    # Check command line arguments
    if len(sys.argv) > 1:
        if sys.argv[1] == "--interactive" or sys.argv[1] == "-i":
            interactive_mode(orchestrator)
            return
        
        elif sys.argv[1] == "--test":
            # Run a quick test
            print("\n🧪 Running quick test...")
            test_task = Task(
                id="TEST_001",
                title="Quick Test",
                description="Write a simple Python function that returns 'Hello, World!'",
                worker=WorkerType.GROQ_LLAMA8B,
                success_criteria=["Function works correctly"]
            )
            orchestrator.add_task(test_task)
            orchestrator.run_all_tasks()
            return
        
        elif sys.argv[1] == "--status":
            status = orchestrator.get_worker_status()
            print("\n🤖 Worker Status:")
            for worker, info in status.items():
                avail = "✓" if info["available"] else "✗"
                print(f"  [{avail}] {worker}")
            return
    
    # Default: show help
    print("""
Usage:
  python enhanced_orchestrator.py --interactive    Run in interactive mode
  python enhanced_orchestrator.py --test           Run a quick test
  python enhanced_orchestrator.py --status         Show worker status

Or import and use programmatically:

  from enhanced_orchestrator import EnhancedOrchestrator, Task, WorkerType
  
  orchestrator = EnhancedOrchestrator("/path/to/project")
  
  task = Task(
      id="MY_TASK",
      title="My Task",
      description="Do something awesome",
      worker=WorkerType.GROQ_LLAMA70B
  )
  
  orchestrator.add_task(task)
  orchestrator.run_all_tasks()
""")


if __name__ == "__main__":
    main()
