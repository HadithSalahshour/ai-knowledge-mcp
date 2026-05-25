import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

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
    return {
      content: [{ type: "text", text: papers || "No papers found." }]
    };
  }
);
server.tool(
  "get_hn_ai_stories",
  {
    num_stories: z.number().optional().default(10)
  },
  async ({ num_stories }) => {
    const response = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json");
    const allIds = await response.json();
    const ids = allIds.slice(0, 30);

    const stories = await Promise.all(
      ids.map(id =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
          .then(r => r.json())
      )
    );

    const aiKeywords = ["ai", "llm", "gpt", "claude", "machine learning", "neural", "openai", "anthropic", "model", "agent"];

    const aiStories = stories
      .filter(s => s && s.title && aiKeywords.some(k => s.title.toLowerCase().includes(k)))
      .slice(0, num_stories);

    if (aiStories.length === 0) {
      return { content: [{ type: "text", text: "No AI stories on front page right now." }] };
    }

    const result = aiStories.map(s =>
      `Title: ${s.title}\nScore: ${s.score} points\nComments: ${s.descendants || 0}\nURL: ${s.url || "https://news.ycombinator.com/item?id=" + s.id}`
    ).join("\n\n---\n\n");

    return { content: [{ type: "text", text: result }] };
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

    const ids = allIds.slice(0, 30);
    const stories = await Promise.all(
      ids.map(id =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json())
      )
    );

    const aiKeywords = ["ai", "llm", "gpt", "claude", "machine learning", "neural", "openai", "anthropic", "model", "agent"];
    const aiStories = stories
      .filter(s => s && s.title && aiKeywords.some(k => s.title.toLowerCase().includes(k)))
      .slice(0, 5)
      .map(s => `- ${s.title} (${s.score} pts) — ${s.url || "https://news.ycombinator.com/item?id=" + s.id}`)
      .join("\n");

    const today = new Date().toDateString();

    return {
      content: [{
        type: "text",
        text: `# AI Daily Digest — ${today}

## Latest Research (ArXiv)
${papers}

## What Engineers Are Discussing (Hacker News)
${aiStories || "No AI stories on front page right now."}

---
Summarize these into a clean brief: what's the most important thing happening in AI today?`
      }]
    };
  }
);
const transport = new StdioServerTransport();
await server.connect(transport);
