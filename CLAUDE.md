# Realtime Voice Agent

## Stack
- Orchestrator: Elixir/Phoenix, OTP supervisors
- Audio engine: Rust, PortAudio, Rubato resampling
- Web UI: Flask + vanilla JS
- AI: STT -> LLM -> TTS over WebSocket

## Commands
- Compile all: mix compile
- Rust audio: cd native/audio_engine && cargo build --release
- Web syntax: .venv/bin/python -m py_compile web/*.py
- Run locally: ./run.sh

## Architecture
- Elixir owns orchestration and process lifecycle
- Rust owns capture/playback/resampling, no business logic
- Flask only exposes UI and session controls
- Never put API keys, model names or devices inline

## Gotchas
- Log lines may start with "[ISO timestamp] ". Strip before parsing
- Streaming resampler must keep state between chunks
- For per-phrase TTS, reset resampler per phrase
- If audio breaks, add logs at every hop before changing code

## Compact Instructions
When compacting, preserve: goal, changed files, failing command, current hypothesis, test results, next exact command.
