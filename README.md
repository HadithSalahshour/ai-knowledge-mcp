# AI Knowledge MCP

A Model Context Protocol (MCP) server that brings current AI research and engineering discussions into compatible clients such as Claude Desktop.

It retrieves papers from arXiv, surfaces relevant Hacker News discussions, and combines both sources into a concise daily digest.

## Available tools

- **`get_ai_papers`** — Finds recent arXiv papers by topic.
- **`get_hn_ai_stories`** — Returns current AI-related stories from Hacker News.
- **`daily_ai_digest`** — Combines recent papers and engineering discussions into one brief.

## Requirements

- Node.js 18 or later
- npm
- An internet connection for retrieving live results

No API keys are required.

## Installation

1. Clone the repository.
2. Open the project directory.
3. Install the dependencies:

```bash
npm install
```

## Claude Desktop setup

Add the following entry to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "ai-knowledge-mcp": {
      "command": "node",
      "args": ["/YOUR/ABSOLUTE/PATH/TO/ai-knowledge-mcp/server-local.js"]
    }
  }
}
```

Replace the example path with the absolute path to the project on your computer, then restart Claude Desktop.

## Usage examples

Try prompts such as:

- “Use the daily_ai_digest tool.”
- “Find recent papers about reinforcement learning.”
- “Show me current AI discussions from Hacker News.”

## Transport options

The project provides two entry points:

- **`server-local.js`** — Uses the stdio transport required for local Claude Desktop integration.
- **`server.js`** — Uses HTTP transport and exposes the MCP endpoint at `/mcp`.

Start the HTTP server with:

```bash
npm start
```

It runs on port `3000` by default. Set the `PORT` environment variable to use a different port.

## External data sources

The server makes outbound requests to:

- [arXiv](https://arxiv.org/) for research papers
- [Hacker News](https://news.ycombinator.com/) for engineering discussions

Results depend on the availability and content of these external services.

## Built with

- Node.js
- Express
- Model Context Protocol SDK
- Zod
- arXiv API
- Hacker News Firebase API
