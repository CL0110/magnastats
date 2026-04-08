/**
 * Cloudflare Worker — OpenRouter proxy for Magnastats Data Explorer.
 *
 * Deployed to Cloudflare Workers (free tier).
 * Hides the OpenRouter API key and adds basic rate limiting.
 *
 * Environment variable (set in Cloudflare dashboard):
 *   OPENROUTER_KEY — your OpenRouter API key
 */

const SYSTEM_PROMPT = `You are a query parser for a CPS labor market data explorer.
The user will ask a natural language question about U.S. labor market data.
Your job is to translate it into a structured JSON query.

Available dimensions and their valid values:

**outcome** (required, pick one):
- "lfpr" — Labor Force Participation Rate
- "urate" — Unemployment Rate
- "epop" — Employment-Population Ratio

**sex**: "male", "female", or "All"
**age_group**: "16-24", "25-34", "35-44", "45-54", "55-64", "65+", or "All"
**race_eth**: "white_nh" (White non-Hispanic), "black_nh" (Black non-Hispanic), "hispanic", "asian_nh" (Asian), "other", or "All"
**educ**: "less_hs" (less than high school), "hs" (high school diploma), "some_college", "bachelors", "graduate" (advanced degree), or "All"

Data is available from 2018-01 to 2026-02, monthly.

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "outcome": "...",
  "cutA": { "sex": "...", "age_group": "...", "race_eth": "...", "educ": "..." },
  "cutB": null or { "sex": "...", "age_group": "...", "race_eth": "...", "educ": "..." },
  "description": "Brief 1-sentence description of what this query shows"
}

Rules:
- If the user asks for a comparison (e.g. "men vs women"), use cutA and cutB
- If no comparison, set cutB to null
- Default unmentioned dimensions to "All"
- If the user mentions "college" without specifying, use "bachelors"
- If the user mentions "wages" or "earnings", respond with outcome "epop" and add a note in description that wage data isn't available, using EPOP as proxy
- If the user's request is unclear or unrelated to labor market data, still return valid JSON with your best guess and explain in description`;

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // requests per window per IP

// In-memory rate limit (resets on worker restart, good enough for free tier)
const ipCounts = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = ipCounts.get(ip);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW) {
    ipCounts.set(ip, { windowStart: now, count: 1 });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    // Rate limit
    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    if (!checkRateLimit(ip)) {
      return new Response(JSON.stringify({ error: "Rate limited. Try again in a minute." }), {
        status: 429,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    try {
      const { query } = await request.json();
      if (!query || typeof query !== "string" || query.length > 500) {
        return new Response(JSON.stringify({ error: "Invalid query" }), {
          status: 400,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.OPENROUTER_KEY}`,
          "HTTP-Referer": "https://cl0110.github.io/magnastats/",
          "X-Title": "Magnastats Data Explorer",
        },
        body: JSON.stringify({
          model: "anthropic/claude-3.5-haiku",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: query },
          ],
          max_tokens: 300,
          temperature: 0,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return new Response(JSON.stringify({ error: "LLM request failed" }), {
          status: 502,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        return new Response(JSON.stringify({ error: "Empty response from LLM" }), {
          status: 502,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      // Parse and validate the JSON
      let parsed;
      try {
        // Strip markdown code fences if present
        const cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
        parsed = JSON.parse(cleaned);
      } catch {
        return new Response(JSON.stringify({ error: "Failed to parse LLM response", raw: content }), {
          status: 502,
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      }

      return new Response(JSON.stringify(parsed), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: "Internal error" }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }
  },
};
