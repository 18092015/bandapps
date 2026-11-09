import { createServerFn } from "@tanstack/react-start";
import { generateChatCompletion, generateImage, generateVideo, getVideo } from "@lovable.dev/ai-gateway";

const prompt = (d: unknown) => {
  const p = String((d as { prompt?: unknown })?.prompt ?? "").trim().slice(0, 4000);
  if (!p) throw new Error("Digite algo primeiro.");
  return { prompt: p };
};

export const askGemini = createServerFn({ method: "POST" })
  .inputValidator(prompt)
  .handler(async ({ data }) => {
    const res = await generateChatCompletion({
      model: "google/gemini-3.8-flash",
      messages: [
        { role: "system", content: "Você é um assistente útil. Responda em português, de forma clara." },
        { role: "user", content: data.prompt },
      ],
    });
    const c = res.choices?.[0]?.message?.content;
    return { text: typeof c === "string" ? c : JSON.stringify(c ?? "") };
  });

export const makeImage = createServerFn({ method: "POST" })
  .inputValidator(prompt)
  .handler(async ({ data }) => {
    const res = await generateImage({ model: "google/gemini-3-pro-image", prompt: data.prompt, size: "1024x1024" });
    const b64 = res.data?.[0]?.b64_json;
    if (!b64) throw new Error("Nenhuma imagem gerada.");
    return { src: `data:image/png;base64,${b64}` };
  });

export const startVideo = createServerFn({ method: "POST" })
  .inputValidator(prompt)
  .handler(async ({ data }) => {
    const job = await generateVideo({
      model: "google/gemini-omni-1.1-flash",
      input: data.prompt,
      response_format: { type: "video", duration: "6s", resolution: "720p", aspect_ratio: "16:9" },
    });
    return { id: job.id };
  });

export const videoStatus = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => ({ id: String(d.id) }))
  .handler(async ({ data }) => {
    const j = (await getVideo(data.id)) as { status: string; progress?: number; error?: { message: string } };
    return { status: j.status, progress: j.progress ?? 0, error: j.error?.message ?? null };
  });
