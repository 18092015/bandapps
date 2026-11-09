import { createFileRoute } from "@tanstack/react-router";
import { downloadVideo } from "@lovable.dev/ai-gateway";

export const Route = createFileRoute("/api/public/video/$id")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        if (!/^[\w-]+$/.test(params.id)) return new Response("Bad id", { status: 400 });
        const bin = await downloadVideo(params.id);
        return bin.toResponse({ headers: { "content-type": bin.contentType || "video/mp4" } });
      },
    },
  },
});
