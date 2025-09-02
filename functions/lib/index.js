"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const zod_1 = require("zod");
const nanoid_1 = require("nanoid");
// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();
// Express app
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: true }));
app.use(express_1.default.json());
// Validation schemas
const createRoomSchema = zod_1.z.object({
    hostName: zod_1.z.string().min(1).max(20),
});
const joinRoomSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(20),
});
// Remove unused schema for now
// Utility functions
function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
function generateToken() {
    return (0, nanoid_1.nanoid)(32);
}
// Middleware to verify token
async function verifyToken(req, res, next) {
    var _a;
    const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.replace('Bearer ', '');
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
    }
    catch (error) {
        res.status(401).json({ error: 'Token verification failed' });
    }
}
// Routes
app.post('/rooms', async (req, res) => {
    try {
        const { hostName } = createRoomSchema.parse(req.body);
        const code = generateRoomCode();
        const hostId = (0, nanoid_1.nanoid)();
        const hostToken = generateToken();
        const room = {
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
    }
    catch (error) {
        console.error('Create room error:', error);
        res.status(400).json({ error: 'Failed to create room' });
    }
});
app.post('/rooms/:code/join', async (req, res) => {
    try {
        const { code } = req.params;
        const { name } = joinRoomSchema.parse(req.body);
        const roomRef = db.collection('rooms').doc(code);
        const result = await db.runTransaction(async (transaction) => {
            const roomDoc = await transaction.get(roomRef);
            if (!roomDoc.exists) {
                throw new Error('Room not found');
            }
            const room = roomDoc.data();
            if (room.state !== 'lobby') {
                throw new Error('Game already started');
            }
            if (room.players.length >= 8) {
                throw new Error('Room is full');
            }
            const playerId = (0, nanoid_1.nanoid)();
            const token = generateToken();
            const newPlayer = {
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
    }
    catch (error) {
        console.error('Join room error:', error);
        res.status(400).json({ error: error.message || 'Failed to join room' });
    }
});
// Get room info
app.get('/rooms/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const roomDoc = await db.collection('rooms').doc(code).get();
        if (!roomDoc.exists) {
            res.status(404).json({ error: 'Room not found' });
            return;
        }
        res.json(roomDoc.data());
    }
    catch (error) {
        console.error('Get room error:', error);
        res.status(500).json({ error: 'Failed to get room' });
    }
});
// Start game
app.post('/rooms/:code/start', verifyToken, async (req, res) => {
    try {
        const { code } = req.params;
        const { isHost, roomCode } = req.user;
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
            const room = roomDoc.data();
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
    }
    catch (error) {
        console.error('Start game error:', error);
        res.status(400).json({ error: error.message || 'Failed to start game' });
    }
});
exports.api = functions.https.onRequest(app);
//# sourceMappingURL=index.js.map