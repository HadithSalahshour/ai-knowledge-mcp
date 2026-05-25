# AI Knowledge MCP

An MCP (Model Context Protocol) server that gives Claude real-time access to AI research and engineering discussions.

## Tools

- **get_ai_papers** — Fetches latest AI papers from ArXiv by topic
- **get_hn_ai_stories** — Gets top AI stories from Hacker News right now
- **daily_ai_digest** — Combines both sources into a single daily brief

## Setup

1. Clone this repo
2. Run `npm install`
3. Add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "ai-knowledge-mcp": {
      "command": "node",
      "args": ["/YOUR/PATH/TO/server.js"]
    }
  }
}
```

4. Restart Claude Desktop

## Usage

In Claude Desktop:
- "Use the daily_ai_digest tool"
- "Use get_ai_papers to find papers on reinforcement learning"
- "Use get_hn_ai_stories to show me what engineers are discussing"

## Built with

- Node.js
- @modelcontextprotocol/sdk
- ArXiv API
- Hacker News Firebase API
