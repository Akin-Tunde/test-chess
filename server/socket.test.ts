import { describe, expect, it, vi, beforeEach } from "vitest";
import { initializeSocket } from "./socket";
import { Server as SocketIOServer } from "socket.io";
import { EventEmitter } from "events";

// Mock Socket.io
vi.mock("socket.io", () => {
  const mockIo = {
    on: vi.fn(),
    emit: vi.fn(),
    to: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
  };
  return {
    Server: vi.fn().mockImplementation(() => mockIo),
  };
});

describe("Socket.io Communication", () => {
  let io: any;
  let mockHttpServer: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockHttpServer = {};
    io = initializeSocket(mockHttpServer);
  });

  it("should initialize socket server", () => {
    expect(SocketIOServer).toHaveBeenCalledWith(mockHttpServer, expect.any(Object));
  });

  it("should handle player registration", () => {
    const mockSocket = new EventEmitter() as any;
    mockSocket.id = "socket-123";
    mockSocket.data = {};
    mockSocket.join = vi.fn();
    
    // Get the connection handler
    const connectionHandler = io.on.mock.calls.find((call: any) => call[0] === "connection")[1];
    connectionHandler(mockSocket);

    // Simulate registration
    mockSocket.emit("player:register", 1);
    // Since we're using a real EventEmitter for mockSocket, we need to trigger it
    // But the socket.ts code adds listeners to the socket.
    // Let's find the listener added to mockSocket.
    const registerHandler = mockSocket.listeners("player:register")[0];
    registerHandler(1);

    expect(mockSocket.data.playerId).toBe(1);
  });

  it("should relay moves to game room", () => {
    const mockSocket = new EventEmitter() as any;
    mockSocket.id = "socket-123";
    mockSocket.data = { playerId: 1 };
    mockSocket.join = vi.fn();
    mockSocket.to = vi.fn().mockReturnThis();
    mockSocket.emit = vi.fn();

    const connectionHandler = io.on.mock.calls.find((call: any) => call[0] === "connection")[1];
    connectionHandler(mockSocket);

    const moveHandler = mockSocket.listeners("game:move")[0];
    const moveData = { from: "e2", to: "e4" };
    moveHandler("game-456", moveData);

    expect(mockSocket.to).toHaveBeenCalledWith("game:game-456");
    expect(mockSocket.emit).toHaveBeenCalledWith("game:move-received", expect.objectContaining({
      playerId: 1,
      move: moveData
    }));
  });
});
