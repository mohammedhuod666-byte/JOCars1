#!/usr/bin/env python3
"""
Autonomous Agent — ReAct-style loop that plans and executes tools via an
OpenAI-compatible LLM until the goal is satisfied or a step budget is used.

Usage:
  python autonomous_agent.py "your goal here"

Environment:
  AGENT_MODEL      – model name (default: gpt-4o)
  AGENT_BASE_URL   – optional custom base URL for OpenAI-compatible APIs
  AGENT_API_KEY     – optional API key (falls back to OPENAI_API_KEY)
  AGENT_LOG_FILE    – optional path to append structured logs (JSON lines)
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import traceback
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Callable, Optional

try:
    import openai
except Exception as e:
    print(f"ERROR: openai package required — run `pip install openai` first. ({e})")
    sys.exit(1)


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
MODEL = os.environ.get("AGENT_MODEL", "gpt-4o")
BASE_URL = os.environ.get("AGENT_BASE_URL", None)
API_KEY = os.environ.get("AGENT_API_KEY") or os.environ.get("OPENAI_API_KEY", "")

if BASE_URL:
    client = openai.OpenAI(api_key=API_KEY, base_url=BASE_URL)
else:
    client = openai.Openai(api_key=API_KEY) if API_KEY else openai.OpenAI()

LOG_FILE = os.environ.get("AGENT_LOG_FILE", None)


def log_json(**kwargs):
    """Append a JSON line to LOG_FILE if set; always print to stdout."""
    record = {"ts": datetime.now(timezone.utc).isoformat(), **kwargs}
    if LOG_FILE:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
    print(json.dumps(record, ensure_ascii=False))


# ---------------------------------------------------------------------------
# Tools
# ---------------------------------------------------------------------------
def tool_bash(command: str) -> str:
    """Run a shell command (timeout 60s). Returns stdout or stderr."""
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            timeout=60,
            executable="/bin/bash",
        )
        output = result.stdout.strip() or result.stderr.strip()
        if result.returncode != 0 and not output:
            output = f"command failed with code {result.returncode}"
        return output
    except subprocess.TimeoutExpired:
        return "Command timed out after 60 seconds."
    except Exception as e:
        return f"Command error: {e}"


def tool_python(code: str) -> str:
    """Execute Python code in a restricted globals sandbox. Captures printed output."""
    try:
        buf: list[str] = []
        safe_print = lambda *a, **kw: buf.append(" ".join(map(str, a)))
        g = {
            "__builtins__": {
                "print": safe_print,
                "range": range,
                "len": len,
                "str": str,
                "int": int,
                "float": float,
                "list": list,
                "dict": dict,
                "bool": bool,
                "None": None,
                "True": True,
                "False": False,
                "import": __import__,
                "open": open,
                "enumerate": enumerate,
                "zip": zip,
                "map": map,
                "filter": filter,
                "sum": sum,
                "min": min,
                "max": max,
                "abs": abs,
                "sorted": sorted,
                "reversed": reversed,
                "isinstance": isinstance,
                "hasattr": hasattr,
                "getattr": getattr,
                "setattr": setattr,
            },
            "_capture": buf,
            "result": None,
        }
        exec(code, g)
        payload = g.get("result")
        text = "\n".join(buf).strip()
        if payload is not None:
            text = text + ("\n" if text else "") + json.dumps(payload, ensure_ascii=False, default=str)
        return text or "(no output)"
    except Exception as e:
        tb = traceback.format_exc()
        return f"Python error:\n{tb}"


def tool_respond(message: str) -> str:
    """End the episode with a final answer for the user."""
    return f"__FINAL__:{message}"


TOOL_MAP: dict[str, Callable[..., str]] = {
    "bash": tool_bash,
    "python": tool_python,
    "respond": tool_respond,
}

TOOL_DESC = {
    "bash": "Run a shell command and observe stdout/stderr.",
    "python": "Run Python code; use `result = ...` to return a value, print() is captured.",
    "respond": "Return the final answer to the user and end the episode.",
}


# ---------------------------------------------------------------------------
# Agent
# ---------------------------------------------------------------------------
@dataclass
class Agent:
    goal: str
    max_steps: int = 30
    step: int = 0
    messages: list[dict[str, Any]] = field(default_factory=list)
    tools: dict[str, Callable[..., str]] = field(default=lambda: TOOL_MAP)

    SYSTEM = (
        "You are an autonomous agent. You solve the user's GOAL by calling tools one at a time, "
        "observing the result, and deciding the next action. Keep going until the goal is clearly "
        "achieved, then call `respond` with the final answer. Don't call more than one tool per turn. "
        "Always think before acting.\n\n"
        "Available tools:\n"
        + "\n".join(f"- {n}: {d}" for n, d in TOOL_DESC.items())
        + "\n\nFormat every turn as a single JSON object: {\"thought\": \"...\", \"action\": {\"name\": \"...\", \"args\": {...}}}"
    )

    def add_message(self, role: str, content: Any) -> None:
        self.messages.append({"role": role, "content": content})

    def run(self) -> Optional[str]:
        self.add_message("system", self.SYSTEM)
        self.add_message("user", f"GOAL:\n{self.goal}\n\nDecide what to do first.")
        log_json(phase="start", goal=self.goal, model=MODEL)

        for _ in range(self.max_steps):
            self.step += 1
            log_json(phase="think", step=self.step)
            decision = self._next_decision()
            if decision is None:
                self.add_message("assistant", "I could not decide on an action. Stopping.")
                break

            name = decision.get("action", {}).get("name")
            args = decision.get("action", {}).get("args", {})
            thought = decision.get("thought", "")

            log_json(phase="action", step=self.step, tool=name, args=args, thought=thought)
            self.add_message("assistant", json.dumps(decision))

            if name not in self.tools:
                err = f"Unknown tool: {name}. Available: {list(self.tools)}"
                self.add_message("user", f"Observation:\n{err}")
                log_json(phase="error", step=self.step, error=err)
                continue

            try:
                result = self.tools[name](**args)
            except Exception as e:
                result = f"Tool execution error: {e}\n{traceback.format_exc()}"

            log_json(phase="observe", step=self.step, tool=name, result_preview=result[:500])

            if name == "respond":
                final = args.get("message", result)
                log_json(phase="done", step=self.step, final=final)
                return final

            self.add_message("user", f"Observation from {name}:\n{result}")

        log_json(phase="timeout", step=self.step, reason="max_steps reached")
        return None

    def _next_decision(self) -> Optional[dict]:
        try:
            resp = client.chat.completions.create(
                model=MODEL,
                messages=self.messages[-20:],  # keep recent context bounded
                max_tokens=2048,
                temperature=0.0,
                response_format={"type": "json_object"},
            )
        except Exception as e:
            log_json(phase="error", step=self.step, error=f"LLM call failed: {e}")
            return None

        message = (resp.choices[0].message or {}).get("content", "")
        if not message:
            return None

        try:
            parsed = json.loads(message)
            if isinstance(parsed, dict) and "action" in parsed:
                return parsed
            # Fallback: if model returned plain text with a JSON blob, try extracting
            start = message.find("{")
            end = message.rfind("}")
            if start != -1 and end != -1:
                try:
                    return json.loads(message[start : end + 1])
                except Exception:
                    pass
            return {"thought": message, "action": {"name": "respond", "args": {"message": message}}}
        except Exception:
            return {"thought": message, "action": {"name": "respond", "args": {"message": message}}}


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
def main() -> None:
    if len(sys.argv) < 2:
        print("Usage: python autonomous_agent.py <goal>")
        sys.exit(1)

    goal = sys.argv[1]
    if not goal.strip():
        print("ERROR: goal must not be empty.")
        sys.exit(1)

    agent = Agent(goal=goal)
    final = agent.run()

    if final:
        print("\n=== FINAL ANSWER ===")
        print(final)
    else:
        print("\n=== NO FINAL ANSWER (step budget exhausted or error) ===")
        sys.exit(2)


if __name__ == "__main__":
    main()
