import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import { nanoid } from 'nanoid';

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Express app
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Types
interface Player {
  id: string;
  name: string;
  avatar?: any;
  isHost: boolean;
  connected: boolean;
  createdAt: number;
}

interface Room {
  code: string;
  hostId: string;
  players: Player[];
  config: any;
  state: string;
  topic?: any;
  assignments?: any[];
  rounds: any[];
  createdAt: number;
  updatedAt: number;
}

// Validation schemas
const createRoomSchema = z.object({
  hostName: z.string().min(1).max(20),
});

const joinRoomSchema = z.object({
  name: z.string().min(1).max(20),
});

// Remove unused schema for now

// Utility functions
function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateToken(): string {
  return nanoid(32);
}

// Extend Request interface
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Middleware to verify token
async function verifyToken(req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ error: 'Token required' });
    return;
  }

  try {
    const tokenDoc = await db.collection('tokens').doc(token).get();
    if (!tokenDoc.exists) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    req.user = tokenDoc.data();
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token verification failed' });
  }
}

// Routes
app.post('/rooms', async (req: express.Request, res: express.Response) => {
  try {
    const { hostName } = createRoomSchema.parse(req.body);

    const code = generateRoomCode();
    const hostId = nanoid();
    const hostToken = generateToken();

    const room: Room = {
      code,
      hostId,
      players: [{
        id: hostId,
        name: hostName,
        isHost: true,
        connected: true,
        createdAt: Date.now(),
      }],
      config: {
        undercoverCount: 1,
        blankCount: 0,
        timers: { speak: 60, vote: 30 },
        lang: 'zh-TW',
      },
      state: 'lobby',
      rounds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Save room
    await db.collection('rooms').doc(code).set(room);

    // Save host token
    await db.collection('tokens').doc(hostToken).set({
      playerId: hostId,
      roomCode: code,
      isHost: true,
      createdAt: Date.now(),
    });

    res.json({ code, hostToken });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(400).json({ error: 'Failed to create room' });
  }
});

app.post('/rooms/:code/join', async (req: express.Request, res: express.Response) => {
  try {
    const { code } = req.params;
    const { name } = joinRoomSchema.parse(req.body);

    const roomRef = db.collection('rooms').doc(code);

    const result = await db.runTransaction(async (transaction) => {
      const roomDoc = await transaction.get(roomRef);

      if (!roomDoc.exists) {
        throw new Error('Room not found');
      }

      const room = roomDoc.data() as Room;

      if (room.state !== 'lobby') {
        throw new Error('Game already started');
      }

      if (room.players.length >= 8) {
        throw new Error('Room is full');
      }

      const playerId = nanoid();
      const token = generateToken();

      const newPlayer: Player = {
        id: playerId,
        name,
        isHost: false,
        connected: true,
        createdAt: Date.now(),
      };

      // Update room
      transaction.update(roomRef, {
        players: admin.firestore.FieldValue.arrayUnion(newPlayer),
        updatedAt: Date.now(),
      });

      // Save player token
      transaction.set(db.collection('tokens').doc(token), {
        playerId,
        roomCode: code,
        isHost: false,
        createdAt: Date.now(),
      });

      return { playerId, token };
    });

    res.json(result);
  } catch (error) {
    console.error('Join room error:', error);
    res.status(400).json({ error: (error as Error).message || 'Failed to join room' });
  }
});

// Get room info
app.get('/rooms/:code', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { code } = req.params;
    const roomDoc = await db.collection('rooms').doc(code).get();

    if (!roomDoc.exists) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }

    res.json(roomDoc.data());
  } catch (error) {
    console.error('Get room error:', error);
    res.status(500).json({ error: 'Failed to get room' });
  }
});

// Start game
app.post('/rooms/:code/start', verifyToken, async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { code } = req.params;
    const { isHost, roomCode } = req.user as any;

    if (!isHost || roomCode !== code) {
      res.status(403).json({ error: 'Only host can start game' });
      return;
    }

    const roomRef = db.collection('rooms').doc(code);

    await db.runTransaction(async (transaction) => {
      const roomDoc = await transaction.get(roomRef);

      if (!roomDoc.exists) {
        throw new Error('Room not found');
      }

      const room = roomDoc.data() as Room;

      if (room.state !== 'lobby') {
        throw new Error('Game already started');
      }

      if (room.players.length < 3) {
        throw new Error('Need at least 3 players');
      }

      // TODO: Assign roles and topics
      transaction.update(roomRef, {
        state: 'speaking',
        updatedAt: Date.now(),
      });
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Start game error:', error);
    res.status(400).json({ error: (error as Error).message || 'Failed to start game' });
  }
});

export const api = functions.https.onRequest(app);
