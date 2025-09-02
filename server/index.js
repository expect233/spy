
/**
 * Undercover (誰是臥底) - Minimal Multiplayer MVP
 * Server: Node + Colyseus + Express
 * Run: npm install && npm start (inside /server)
 * Then open http://localhost:2567 in your browser.
 */
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server, Room } = require('colyseus');
const { Schema, type, MapSchema, defineTypes } = require('@colyseus/schema');
const { ZodError, z } = require('zod');
const path = require('path');

// Optional AI provider (OpenAI). If OPENAI_API_KEY is not set, we'll use fallback pairs.
let openaiClient = null;
try {
  const { OpenAI } = require('openai');
  if (process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
} catch (e) {
  // openai not installed properly or other error; we'll just use fallbacks.
}

const PORT = process.env.PORT || 2567;

/* -------------------------- Schema Definitions -------------------------- */

class Player extends Schema {
  constructor() {
    super();
    this.id = "";
    this.name = "";
    this.ready = false;
    this.alive = true;
    this.hasSpoken = false;
    this.isHost = false;
  }
}
defineTypes(Player, {
  id: "string",
  name: "string",
  ready: "boolean",
  alive: "boolean",
  hasSpoken: "boolean",
  isHost: "boolean",
});

class RoomState extends Schema {
  constructor() {
    super();
    this.phase = "lobby"; // 'lobby' | 'clue' | 'vote' | 'end'
    this.players = new MapSchema();
    this.hostId = "";
    this.spyCount = 1;
    this.round = 0;
    this.topicHint = ""; // e.g., "動物", only public hint if desired
    this.lastEliminatedName = "";
    this.winner = ""; // 'civilians' | 'spies' | ''
  }
}
defineTypes(RoomState, {
  phase: "string",
  players: { map: Player },
  hostId: "string",
  spyCount: "number",
  round: "number",
  topicHint: "string",
  lastEliminatedName: "string",
  winner: "string",
});

/* --------------------------- Utility Functions -------------------------- */

const nameSchema = z.string().min(1).max(20);
const clueSchema = z.string().min(1).max(100);
const voteSchema = z.string().min(1).max(100);

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Fallback pairs (civilian vs spy word). Keep pairs close enough to be tricky.
const FALLBACK_PAIRS = [
  ["蘋果", "梨子"],
  ["咖啡", "可可"],
  ["籃球", "排球"],
  ["筷子", "湯匙"],
  ["電梯", "手扶梯"],
  ["火鍋", "湯麵"],
  ["雨衣", "雨傘"],
  ["海豚", "鯨魚"],
  ["棉被", "床單"],
  ["口紅", "唇膏"],
];

async function generateWordsWithAI() {
  // Returns { civilianWord, spyWord, topicHint }
  if (!openaiClient) {
    const [a, b] = pickRandom(FALLBACK_PAIRS);
    return { civilianWord: a, spyWord: b, topicHint: "" };
  }
  try {
    const prompt = `請你扮演誰是臥底的題庫出題者。請輸出兩個中文詞語，彼此「相似但不同」，
用 JSON 回答，鍵為 civilianWord, spyWord, topicHint（topicHint 可空字串）。
例如 {"civilianWord":"蘋果","spyWord":"梨子","topicHint":"水果"}`;

    const resp = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "你是遊戲題庫助手。" },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });
    const text = resp.choices[0].message.content.trim();
    // Try parse JSON from response
    let data = null;
    try {
      data = JSON.parse(text);
    } catch (e) {
      // fallback parse: find JSON-like substring
      const m = text.match(/\{[\s\S]*\}/);
      if (m) data = JSON.parse(m[0]);
    }
    if (
      data &&
      typeof data.civilianWord === "string" &&
      typeof data.spyWord === "string"
    ) {
      return {
        civilianWord: data.civilianWord,
        spyWord: data.spyWord,
        topicHint: typeof data.topicHint === "string" ? data.topicHint : "",
      };
    }
  } catch (e) {
    console.warn("AI generation failed, using fallback.", e.message);
  }
  const [a, b] = pickRandom(FALLBACK_PAIRS);
  return { civilianWord: a, spyWord: b, topicHint: "" };
}

/* ------------------------------- The Room -------------------------------- */

class UndercoverRoom extends Room {
  onCreate(options) {
    this.setState(new RoomState());
    this.maxClients = 12;

    // Secrets (not in state, per-client visibility)
    this.roles = new Map(); // sessionId -> 'spy' | 'civilian'
    this.secretWords = new Map(); // sessionId -> string
    this.clues = new Map(); // sessionId -> string
    this.votes = new Map(); // voterSessionId -> targetSessionId

    this.onMessage("setName", (client, payload) => {
      try {
        const name = nameSchema.parse((payload && payload.name) || "");
        const p = this.state.players.get(client.sessionId);
        if (p) {
          p.name = name;
        }
      } catch (e) {}
    });

    this.onMessage("toggleReady", (client) => {
      const p = this.state.players.get(client.sessionId);
      if (p && this.state.phase === "lobby") {
        p.ready = !p.ready;
      }
    });

    this.onMessage("setSpyCount", (client, payload) => {
      const p = this.state.players.get(client.sessionId);
      if (p && p.isHost && this.state.phase === "lobby") {
        const n = Math.max(1, Math.min(4, Number(payload && payload.count)));
        this.state.spyCount = n;
      }
    });

    this.onMessage("startGame", async (client) => {
      const p = this.state.players.get(client.sessionId);
      if (!p || !p.isHost) return;
      if (this.state.phase !== "lobby") return;

      const readyPlayers = [...this.state.players.values()].filter((pl) => pl.ready);
      if (readyPlayers.length < 3) {
        client.send("error", { message: "至少需要 3 位已準備玩家才能開始。" });
        return;
      }

      // Assign roles
      const participants = readyPlayers.map((pl) => pl.id);
      const spyCount = Math.min(this.state.spyCount, participants.length - 1);
      const spies = new Set();

      while (spies.size < spyCount) {
        spies.add(pickRandom(participants));
      }

      const { civilianWord, spyWord, topicHint } = await generateWordsWithAI();
      this.state.topicHint = topicHint || "";

      // setup round
      this.state.phase = "clue";
      this.state.round = 1;
      this.clues.clear();
      this.votes.clear();
      this.state.lastEliminatedName = "";
      this.state.winner = "";

      // reset players (alive/hasSpoken) & assign roles/words
      this.roles.clear();
      this.secretWords.clear();
      for (const pl of this.state.players.values()) {
        pl.alive = pl.ready; // only ready players join game
        pl.hasSpoken = false;
        if (!pl.alive) continue;

        const role = spies.has(pl.id) ? "spy" : "civilian";
        this.roles.set(pl.id, role);
        const word = role === "spy" ? spyWord : civilianWord;
        this.secretWords.set(pl.id, word);

        // Send private word+role
        const c = this.clients.find((c) => c.sessionId === pl.id);
        if (c) {
          c.send("secret", { role, word, topicHint: this.state.topicHint });
        }
      }

      this.broadcast("phase", { phase: this.state.phase, round: this.state.round });
    });

    this.onMessage("submitClue", (client, payload) => {
      if (this.state.phase !== "clue") return;
      const p = this.state.players.get(client.sessionId);
      if (!p || !p.alive || p.hasSpoken) return;

      try {
        const clue = clueSchema.parse((payload && payload.clue) || "");
        this.clues.set(client.sessionId, clue);
        p.hasSpoken = true;

        // Broadcast clue (public information)
        this.broadcast("clue", { playerId: p.id, name: p.name, clue });

        // If all alive players have spoken, move to vote phase
        const alivePlayers = [...this.state.players.values()].filter((pl) => pl.alive);
        const spokeCount = alivePlayers.filter((pl) => pl.hasSpoken).length;
        if (spokeCount === alivePlayers.length) {
          this.state.phase = "vote";
          this.votes.clear();
          this.broadcast("phase", { phase: "vote", round: this.state.round });
        }
      } catch (e) {
        if (e instanceof ZodError) {
          client.send("error", { message: "提示字數 1~100。" });
        }
      }
    });

    this.onMessage("submitVote", (client, payload) => {
      if (this.state.phase !== "vote") return;
      const p = this.state.players.get(client.sessionId);
      if (!p || !p.alive) return;

      try {
        const targetId = voteSchema.parse((payload && payload.targetId) || "");
        const target = this.state.players.get(targetId);
        if (!target || !target.alive) {
          client.send("error", { message: "無效票。" });
          return;
        }
        this.votes.set(client.sessionId, targetId);

        // When all alive players have voted, tally
        const aliveIds = [...this.state.players.values()].filter((pl) => pl.alive).map((pl) => pl.id);
        if (aliveIds.every((id) => this.votes.has(id))) {
          // Count votes
          const tally = new Map();
          for (const tid of this.votes.values()) {
            tally.set(tid, (tally.get(tid) || 0) + 1);
          }
          // Find max
          let max = 0;
          for (const v of tally.values()) max = Math.max(max, v);
          const top = [...tally.entries()].filter(([, v]) => v === max).map(([k]) => k);

          // Resolve tie: random among tied
          const eliminatedId = top[Math.floor(Math.random() * top.length)];
          const eliminated = this.state.players.get(eliminatedId);
          if (eliminated) {
            eliminated.alive = false;
            this.state.lastEliminatedName = eliminated.name;
            this.broadcast("eliminated", { id: eliminated.id, name: eliminated.name });
          }

          // Check win/lose
          const alive = [...this.state.players.values()].filter((pl) => pl.alive);
          const spies = alive.filter((pl) => this.roles.get(pl.id) === "spy").length;
          const civilians = alive.length - spies;

          if (spies === 0) {
            this.state.phase = "end";
            this.state.winner = "civilians";
            this.broadcast("phase", { phase: "end", winner: "civilians" });
          } else if (spies >= civilians) {
            this.state.phase = "end";
            this.state.winner = "spies";
            this.broadcast("phase", { phase: "end", winner: "spies" });
          } else {
            // Next round
            this.state.round += 1;
            this.state.phase = "clue";
            this.clues.clear();
            this.votes.clear();
            // reset spoken flags
            for (const pl of this.state.players.values()) {
              if (pl.alive) pl.hasSpoken = false;
            }
            this.broadcast("phase", { phase: "clue", round: this.state.round });
          }
        }
      } catch (e) {
        if (e instanceof ZodError) {
          client.send("error", { message: "投票格式錯誤。" });
        }
      }
    });

    this.onMessage("chat", (client, payload) => {
      const p = this.state.players.get(client.sessionId);
      if (!p) return;
      const text = String((payload && payload.text) || "").slice(0, 200);
      this.broadcast("chat", { name: p.name || "玩家", text });
    });
  }

  onJoin(client, options) {
    const p = new Player();
    p.id = client.sessionId;
    p.name = `玩家${Object.keys(this.state.players).length + 1}`;
    p.ready = false;
    p.alive = true;
    p.hasSpoken = false;
    p.isHost = this.clients.length === 1; // first joiner is host

    if (p.isHost) {
      this.state.hostId = p.id;
    }
    this.state.players.set(client.sessionId, p);

    client.send("joined", { id: p.id, isHost: p.isHost });
    this.broadcast("system", { text: `${p.name} 加入房間` });
  }

  onLeave(client, consented) {
    const p = this.state.players.get(client.sessionId);
    if (!p) return;
    this.state.players.delete(client.sessionId);
    this.roles.delete(client.sessionId);
    this.secretWords.delete(client.sessionId);
    this.clues.delete(client.sessionId);
    this.votes.delete(client.sessionId);

    // Reassign host if needed
    if (p.isHost) {
      const next = [...this.state.players.values()][0];
      if (next) {
        next.isHost = true;
        this.state.hostId = next.id;
        const c = this.clients.find((c) => c.sessionId === next.id);
        if (c) c.send("host", { youAreHost: true });
        this.broadcast("system", { text: `${next.name} 成為新房主` });
      } else {
        this.state.hostId = "";
      }
    }

    this.broadcast("system", { text: `${p.name} 離開房間` });
  }
}

/* ------------------------------- Bootstrap ------------------------------- */

async function main() {
  const app = express();
  const server = http.createServer(app);
  const gameServer = new Server({ server });

  gameServer.define('undercover', UndercoverRoom);

  // Serve static client
  const pubPath = path.join(__dirname, 'public');
  app.use(express.static(pubPath));
  app.get('/', (req, res) => {
    res.sendFile(path.join(pubPath, 'index.html'));
  });

  server.listen(PORT, () => {
    console.log(`Undercover server listening on http://localhost:${PORT}`);
  });
}

main();
