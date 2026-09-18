import { KokoroTTS } from "kokoro-js";

const MODEL = "onnx-community/Kokoro-82M-ONNX";

console.log("Loading Kokoro model...");

const tts = await KokoroTTS.from_pretrained(MODEL, {
  dtype: "q8",
});

console.log("Generating audio...");

const audio = await tts.generate(
  "Hello! This is my first JavaScript text to speech prototype.",
  {
    voice: "af_bella",
  }
);

await audio.save("output.wav");

console.log("Done! Audio saved as output.wav");