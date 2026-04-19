# Chess Nexus - Architecture Documentation

## Overview

Chess Nexus is a real-time multiplayer chess platform with cyberpunk aesthetics, featuring AI opponents, tactical puzzles, leaderboards, and push notifications.

## Technology Stack

- **Frontend**: React 19 + TypeScript + Tailwind CSS 4
- **Backend**: Express 4 + tRPC 11
- **Database**: MySQL/TiDB via Drizzle ORM
- **Real-time**: Socket.io 4.8
- **Chess Engine**: chess.js 1.4 (move validation) + LLM-based AI
- **Authentication**: Manus OAuth
- **Notifications**: Built-in Manus notification service

## Database Schema

### Core Tables

**users** - Extended with chess statistics
- `id`, `openId`, `name`, `email`, `loginMethod`, `role`
- `rating` - Elo rating (default 1200)
- `wins`, `losses`, `draws` - Game statistics
- `createdAt`, `updatedAt`, `lastSignedIn`

**games** - Multiplayer game records
- `id` - Unique game identifier
- `whitePlayerId`, `blackPlayerId` - Player references
- `status` - pending, active, completed, abandoned
- `result` - white_win, black_win, draw, abandoned
- `pgn` - Portable Game Notation
- `moves` - JSON array of move objects
- `startedAt`, `completedAt` - Timestamps

**gameInvitations** - Player-to-player game requests
- `id`, `fromPlayerId`, `toPlayerId`
- `status` - pending, accepted, rejected, expired
- `gameId` - Reference to created game
- `expiresAt` - 24-hour expiration

**chatMessages** - In-game communication
- `id`, `gameId`, `playerId`, `message`
- `createdAt`

**puzzles** - Tactical puzzle library
- `id`, `title`, `description`
- `fen` - Starting position
- `solution` - JSON array of correct moves
- `difficulty` - beginner, intermediate, advanced, expert
- `theme` - Puzzle category
- `createdAt`

**puzzleAttempts** - User puzzle progress
- `id`, `puzzleId`, `playerId`
- `solved` - Whether puzzle was solved
- `attempts` - Number of attempts
- `timeSpent` - Milliseconds spent
- `createdAt`

**aiGames** - Single-player AI games
- `id`, `playerId`
- `difficulty` - easy, medium, hard, expert
- `playerColor` - white, black
- `status` - active, completed, abandoned
- `result` - player_win, ai_win, draw, abandoned
- `pgn`, `moves` - Game record
- `startedAt`, `completedAt`

**notifications** - User notifications
- `id`, `userId`
- `type` - game_invitation, turn_alert, puzzle_result, game_result
- `title`, `message`, `data`
- `read` - Boolean flag
- `createdAt`

## Backend Architecture

### Server Structure

```
server/
├── _core/
│   ├── index.ts          # Main server entry, Socket.io initialization
│   ├── env.ts            # Environment configuration
│   ├── context.ts        # tRPC context with auth
│   ├── trpc.ts           # tRPC setup
│   ├── oauth.ts          # Manus OAuth routes
│   └── ...
├── socket.ts             # Socket.io event handlers
├── chess.ts              # Database query helpers
├── chess-routers.ts      # tRPC procedures for chess features
└── routers.ts            # Main app router
```

### Socket.io Events

**Connection & Registration**
- `player:register` - Player registers their socket ID
- `disconnect` - Player disconnects

**Game Events**
- `game:join` - Player joins a game room
- `game:move` - Player makes a move
- `game:opponent-ready` - Opponent is ready
- `game:move-received` - Receive opponent's move
- `game:end` - Game ends
- `game:chat` - In-game chat message
- `game:chat-message` - Receive chat message

**Invitation Events**
- `invite:send` - Send game invitation
- `invite:received` - Receive invitation
- `invite:accept` - Accept invitation
- `invite:accepted` - Invitation accepted
- `invite:reject` - Reject invitation
- `invite:rejected` - Invitation rejected

**Puzzle Events**
- `puzzle:start` - Start puzzle attempt
- `puzzle:submit` - Submit puzzle solution
- `puzzle:result` - Receive puzzle result

## Frontend Architecture

### Page Structure

```
client/src/
├── pages/
│   ├── Home.tsx          # Landing page with feature showcase
│   ├── Lobby.tsx         # Game lobby & matchmaking
│   ├── Game.tsx          # Active game with board & chat
│   ├── Puzzles.tsx       # Puzzle selection & solving
│   ├── GameHistory.tsx   # Replay & analysis
│   ├── Leaderboard.tsx   # Rankings & statistics
│   ├── AIGame.tsx        # Single-player AI mode
│   └── Profile.tsx       # User profile & stats
├── components/
│   ├── ChessBoard.tsx    # Interactive chess board
│   ├── GameChat.tsx      # In-game chat panel
│   ├── MoveHistory.tsx   # Move notation display
│   └── ...
└── lib/
    └── trpc.ts           # tRPC client setup
```

### Key Components

**ChessBoard** - Interactive chess board with:
- Legal move highlighting
- Piece dragging/clicking
- Move history display
- Algebraic notation
- Cyberpunk styling

**GameChat** - Real-time chat with:
- Message history
- Timestamp display
- Player identification
- Neon styling

## Real-time Multiplayer Flow

1. **Game Creation**
   - Player A sends invitation to Player B via tRPC
   - Notification sent to Player B
   - Player B accepts invitation
   - Game created and both players notified

2. **Game Start**
   - Both players join Socket.io game room
   - Board state synchronized
   - Game begins

3. **Move Synchronization**
   - Player makes move (validated by chess.js)
   - Move sent via Socket.io
   - Opponent receives move instantly
   - Board updates on both clients

4. **Game End**
   - Game result determined
   - Both players notified
   - Stats updated
   - Game recorded in history

## AI Single-Player Mode

**Difficulty Levels**
- **Easy**: Random legal moves
- **Medium**: Basic tactical awareness
- **Hard**: Advanced position evaluation
- **Expert**: Deep analysis with time consideration

**Implementation**
- Uses LLM (Claude) for move generation
- Difficulty affects response time and move quality
- Moves validated by chess.js
- Game recorded for history/analysis

## Push Notifications

**Triggers**
1. **Game Invitation** - When invited to play
2. **Turn Alert** - When it's your turn to move
3. **Puzzle Result** - When puzzle attempt completed
4. **Game Result** - When game ends

**Implementation**
- Uses Manus built-in notification service
- Stored in database for history
- Real-time delivery via Socket.io
- User can mark as read

## Cyberpunk Visual Design

**Color Palette**
- Primary: Neon Cyan (#00f5ff)
- Secondary: Neon Pink (#ff006e)
- Accent: Neon Purple (#b537f2)
- Success: Neon Green (#39ff14)
- Background: Deep Black (#0a0e27)
- Card: Dark Blue (#1a1f3a)

**Visual Elements**
- Neon glow text effects
- HUD-style corner brackets
- Technical line dividers
- Scan line animations
- Pulse glow effects
- Geometric sans-serif typography (Orbitron)
- Monospace code font (Space Mono)

**Consistent Styling**
- All pages use cyberpunk theme
- Buttons have neon borders and glow
- Cards have HUD frames
- Text has glow shadows
- Borders are neon-colored
- Scrollbars are neon-styled

## Authentication Flow

1. User clicks "Login with Manus"
2. Redirected to Manus OAuth portal
3. User authenticates
4. Callback to `/api/oauth/callback`
5. Session cookie created
6. User data stored in database
7. Frontend receives authenticated user

## Performance Considerations

- Move validation happens client-side (chess.js)
- Socket.io for low-latency communication
- Database queries optimized with indexes
- Pagination for leaderboard/history
- Lazy loading for puzzle images
- Efficient state management with React hooks

## Deployment

- Frontend: Vite build → static assets
- Backend: Express server with Socket.io
- Database: MySQL/TiDB with migrations
- Environment variables: Manus-managed secrets
- Static files: S3 storage via Manus
- Notifications: Manus built-in service

## Security

- Manus OAuth for authentication
- tRPC type-safe procedures
- Protected routes require authentication
- Move validation prevents cheating
- Rate limiting on API endpoints
- CORS configured for Socket.io
- SQL injection prevention via Drizzle ORM
