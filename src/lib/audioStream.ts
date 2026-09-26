/**
 * Dynamic WAV header parser that walks RIFF subchunks to locate the 'data' payload.
 * Returns { offset, size } for raw PCM audio data.
 */
export function parseWavHeader(buffer: ArrayBuffer): {
  offset: number;
  size: number;
} {
  if (buffer.byteLength < 12) {
    throw new Error("Invalid WAV buffer: less than 12 bytes.");
  }

  const view = new DataView(buffer);

  // Verify 'RIFF' magic bytes
  const riff = String.fromCharCode(
    view.getUint8(0),
    view.getUint8(1),
    view.getUint8(2),
    view.getUint8(3),
  );
  if (riff !== "RIFF") {
    throw new Error("Invalid WAV header: missing RIFF magic bytes.");
  }

  let offset = 12; // Skip RIFF header (4 magic + 4 size + 4 WAVE)
  while (offset + 8 <= buffer.byteLength) {
    const chunkId = String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3),
    );
    const chunkSize = view.getUint32(offset + 4, true);

    if (chunkId === "data") {
      const dataOffset = offset + 8;
      const dataSize = Math.min(chunkSize, buffer.byteLength - dataOffset);
      return { offset: dataOffset, size: dataSize };
    }

    // Advance to next chunk (aligned to 2-byte boundary per WAV spec)
    offset += 8 + chunkSize + (chunkSize % 2);
  }

  // Fallback: if 'data' tag wasn't found in loop, check standard offset 44
  if (buffer.byteLength >= 44) {
    const fallbackSize = view.getUint32(40, true);
    return { offset: 44, size: Math.min(fallbackSize, buffer.byteLength - 44) };
  }

  throw new Error("Could not find 'data' subchunk in WAV buffer.");
}

/**
 * Stitches multiple WAV ArrayBuffers into a single WAV Blob.
 * Dynamically parses subchunk headers to extract PCM samples and synthesizes a master 44-byte WAV header.
 */
export function stitchWavChunks(wavBuffers: ArrayBuffer[]): Blob {
  if (wavBuffers.length === 0) {
    return new Blob([], { type: "audio/wav" });
  }

  if (wavBuffers.length === 1) {
    return new Blob([wavBuffers[0]], { type: "audio/wav" });
  }

  const pcmChunks: Uint8Array[] = [];
  let totalPcmBytes = 0;

  for (const buffer of wavBuffers) {
    try {
      const { offset, size } = parseWavHeader(buffer);
      if (size <= 0) continue;
      const pcm = new Uint8Array(buffer, offset, size);
      pcmChunks.push(pcm);
      totalPcmBytes += size;
    } catch (e) {
      console.warn("Failed to parse WAV chunk header:", e);
    }
  }

  const outBuffer = new Uint8Array(44 + totalPcmBytes);

  // Copy header template from the first chunk (up to 44 bytes)
  const headerSource = new Uint8Array(
    wavBuffers[0],
    0,
    Math.min(44, wavBuffers[0].byteLength),
  );
  outBuffer.set(headerSource, 0);

  const view = new DataView(outBuffer.buffer);

  // Update RIFF chunk size at byte offset 4 (36 + totalPcmBytes)
  view.setUint32(4, 36 + totalPcmBytes, true);

  // Update data subchunk size at byte offset 40 (totalPcmBytes)
  view.setUint32(40, totalPcmBytes, true);

  // Copy PCM chunks into the output buffer
  let writeOffset = 44;
  for (const pcm of pcmChunks) {
    outBuffer.set(pcm, writeOffset);
    writeOffset += pcm.byteLength;
  }

  return new Blob([outBuffer], { type: "audio/wav" });
}

export interface StreamAudioOptions {
  text: string;
  language: string;
  voice: string;
  signal?: AbortSignal;
  onChunk?: (chunkIndex: number, accumulatedDuration: number) => void;
}

export interface StreamAudioResult {
  blob: Blob;
  audioUrl: string;
  audioContext: AudioContext;
}

/**
 * Streams NDJSON audio chunks from /api/tts, plays them live via Web Audio API gaplessly,
 * and stitches chunks into a downloadable WAV blob upon completion.
 */
export async function streamAndPlayAudio(
  options: StreamAudioOptions,
): Promise<StreamAudioResult> {
  const { text, language, voice, signal, onChunk } = options;

  const response = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, language, voice }),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server error (${response.status})`);
  }

  if (!response.body) {
    throw new Error("Response body is missing.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  const audioContext = new AudioCtx();
  let nextStartTime = 0;
  let accumulatedDuration = 0;

  const wavBuffers: ArrayBuffer[] = [];
  let hasCompletionRecord = false;
  let success = false;

  try {
    while (true) {
      if (signal?.aborted) {
        throw signal.reason ?? new DOMException("Aborted", "AbortError");
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        const msg = JSON.parse(line);

        if (msg.index !== undefined) {
          console.log(Date.now(), "chunk received", msg.index);
        }

        if (msg.error) {
          throw new Error(msg.error);
        }
        if (msg.done) {
          hasCompletionRecord = true;
          continue;
        }

        if (msg.audio) {
          const binaryString = atob(msg.audio);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          const arrayBuffer = bytes.buffer;
          wavBuffers.push(arrayBuffer);

          try {
            if (audioContext.state === "suspended") {
              await audioContext.resume();
            }

            const tDecode = Date.now();
            // decodeAudioData detaches the buffer, so slice a copy for Web Audio API playback
            const audioBuf = await audioContext.decodeAudioData(
              arrayBuffer.slice(0),
            );
            console.log(`decode took ${Date.now() - tDecode}ms for chunk ${msg.index}`);
            accumulatedDuration += audioBuf.duration;

            if (onChunk) {
              onChunk(msg.index ?? wavBuffers.length - 1, accumulatedDuration);
            }

            const source = audioContext.createBufferSource();
            source.buffer = audioBuf;
            source.connect(audioContext.destination);

            const startAt = Math.max(audioContext.currentTime, nextStartTime);
            source.start(startAt);
            console.log(
              Date.now(),
              "chunk scheduled to play",
              msg.index,
              "startAt(ctx time)=",
              startAt,
              "ctx.currentTime=",
              audioContext.currentTime,
            );
            nextStartTime = startAt + audioBuf.duration;
          } catch (e) {
            console.warn("Failed to decode audio chunk for live playback:", e);
            if (onChunk) {
              onChunk(msg.index ?? wavBuffers.length - 1, accumulatedDuration);
            }
          }
        }
      }
    }

    if (!hasCompletionRecord) {
      throw new Error("Stream closed before completion record was received.");
    }

    if (wavBuffers.length === 0) {
      throw new Error("No audio chunks received from server.");
    }

    // Wait for live Web Audio playback schedule to finish naturally before resolving
    const remainingTimeMs = Math.max(0, (nextStartTime - audioContext.currentTime) * 1000);
    if (remainingTimeMs > 0) {
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(resolve, remainingTimeMs);
        if (signal) {
          const onAbort = () => {
            clearTimeout(timeout);
            resolve();
          };
          signal.addEventListener("abort", onAbort, { once: true });
        }
      });
    }

    if (signal?.aborted) {
      throw signal.reason ?? new DOMException("Aborted", "AbortError");
    }

    const finalBlob = stitchWavChunks(wavBuffers);
    const audioUrl = URL.createObjectURL(finalBlob);

    success = true;
    return { blob: finalBlob, audioUrl, audioContext };
  } finally {
    reader.releaseLock();
    if (audioContext.state !== "closed") {
      audioContext.close().catch(() => {});
    }
  }
}

