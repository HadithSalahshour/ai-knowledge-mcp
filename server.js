import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";

const app = express();
app.use(express.json());

function createServer() {
  const server = new McpServer({
    name: "ai-knowledge-mcp",
    version: "1.0.0"
  });

  server.tool(
    "get_ai_papers",
    {
      topic: z.string().describe("Topic to search for"),
      max_results: z.number().optional().default(5)
    },
    async ({ topic, max_results }) => {
      const query = encodeURIComponent(topic);
      const url = `https://export.arxiv.org/api/query?search_query=all:${query}&start=0&max_results=${max_results}&sortBy=submittedDate&sortOrder=descending`;
      const response = await fetch(url);
      const xml = await response.text();
      const entries = xml.match(/<entry>([\s\S]*?)<\/entry>/g) || [];
      const papers = entries.map(entry => {
        const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() || "No title";
        const summary = entry.match(/<summary>([\s\S]*?)<\/summary>/)?.[1]?.trim() || "No summary";
        const published = entry.match(/<published>(.*?)<\/published>/)?.[1]?.trim() || "Unknown";
        const link = entry.match(/<id>(.*?)<\/id>/)?.[1]?.trim() || "";
        return `Title: ${title}\nPublished: ${published}\nLink: ${link}\nSummary: ${summary}`;
      }).join("\n\n---\n\n");
      return { content: [{ type: "text", text: papers || "No papers found." }] };
    }
  );

  server.tool(
    "get_hn_ai_stories",
    { num_stories: z.number().optional().default(10) },
    async ({ num_stories }) => {
      const response = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json");
      const allIds = await response.json();
      const stories = await Promise.all(
        allIds.slice(0, 30).map(id =>
          fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json())
        )
      );
      const aiKeywords = ["ai", "llm", "gpt", "claude", "machine learning", "neural", "openai", "anthropic", "model", "agent"];
      const aiStories = stories
        .filter(s => s && s.title && aiKeywords.some(k => s.title.toLowerCase().includes(k)))
        .slice(0, num_stories)
        .map(s => `Title: ${s.title}\nScore: ${s.score} points\nURL: ${s.url || "https://news.ycombinator.com/item?id=" + s.id}`)
        .join("\n\n---\n\n");
      return { content: [{ type: "text", text: aiStories || "No AI stories right now." }] };
    }
  );

  server.tool(
    "daily_ai_digest",
    {},
    async () => {
      const [papersRes, hnRes] = await Promise.all([
        fetch("https://export.arxiv.org/api/query?search_query=all:artificial+intelligence&start=0&max_results=5&sortBy=submittedDate&sortOrder=descending"),
        fetch("https://hacker-news.firebaseio.com/v0/topstories.json")
      ]);
      const xml = await papersRes.text();
      const allIds = await hnRes.json();
      const entries = xml.match(/<entry>([\s\S]*?)<\/entry>/g) || [];
      const papers = entries.map(entry => {
        const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() || "No title";
        const published = entry.match(/<published>(.*?)<\/published>/)?.[1]?.trim() || "Unknown";
        const link = entry.match(/<id>(.*?)<\/id>/)?.[1]?.trim() || "";
        return `- ${title} (${published.slice(0, 10)}) — ${link}`;
      }).join("\n");
      const stories = await Promise.all(
        allIds.slice(0, 30).map(id =>
          fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json())
        )
      );
      const aiKeywords = ["ai", "llm", "gpt", "claude", "machine learning", "neural", "openai", "anthropic", "model", "agent"];
      const aiStories = stories
        .filter(s => s && s.title && aiKeywords.some(k => s.title.toLowerCase().includes(k)))
        .slice(0, 5)
        .map(s => `- ${s.title} (${s.score} pts)`)
        .join("\n");
      return {
        content: [{
          type: "text",
          text: `# AI Daily Digest — ${new Date().toDateString()}\n\n## Latest Research (ArXiv)\n${papers}\n\n## What Engineers Are Discussing (Hacker News)\n${aiStories || "No AI stories right now."}`
        }]
      };
    }
  );

  return server;
}

app.post("/mcp", async (req, res) => {
  const server = createServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT);