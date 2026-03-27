# Installing Ask KDP Kings

## Prerequisites

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) installed and working

## Installation

```bash
claude install-plugin github:cdeistopened/kdp-kings-wiki
```

Or add the plugin directory manually:

```bash
# From your project directory
claude plugin add /path/to/kdp-kings-wiki/plugin
```

Or add it to your `.claude/settings.json`:

```json
{
  "plugins": [
    "/path/to/kdp-kings-wiki/plugin"
  ]
}
```

## First Question to Try

```
Help me find a profitable niche for my first book
```

This routes to the Niche Scout — the skill that evaluates Amazon niches using BSR ranges, review counts, and competition signals from Sean Dollwet, Dale Roberts, and Dave Chesson's methods. It asks about your book type and budget, then gives you a ranked evaluation with specific numbers.

## Other Good Starting Questions

- "How do I fill Amazon's 7 keyword boxes?"
- "I want to reverse-engineer what's working in the fitness journal market"
- "How should I price my paperback vs ebook vs hardcover?"
- "Walk me through uploading my first book to KDP"
- "Build me a 30-day launch plan"

## Troubleshooting

- **Skills not showing:** Make sure the plugin path is correct and Claude Code has been restarted
- **Transcripts not found:** The plugin references data in relative paths — ensure the full wiki directory is present
- **Generic answers:** Try invoking a specific skill directly: `/ask-kdp:niche-scout`

## Learn More

Visit [creativeintel.agency](https://creativeintel.agency) for more Ask [Creator] plugins.
