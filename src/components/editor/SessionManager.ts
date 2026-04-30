import type { Ace } from 'ace-builds';
import { v4 as uuidv4 } from 'uuid';

export interface SessionMetadata {
  id: string;
  filename: string;
  filepath: string | null; // null for untitled
  isDirty: boolean;
  editSession: Ace.EditSession;
  createdAt: number;
}

class SessionManager {
  private sessions: Map<string, SessionMetadata>;
  private sessionOrder: string[];
  private currentIndex: number;

  constructor() {
    this.sessions = new Map();
    this.sessionOrder = [];
    this.currentIndex = -1;
  }

  get activeSession(): SessionMetadata | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.sessionOrder.length) {
      const id = this.sessionOrder[this.currentIndex];
      return this.sessions.get(id) || null;
    }
    return null;
  }

  nextSession(): SessionMetadata | null {
    if (this.sessionOrder.length === 0) return null;
    this.currentIndex = (this.currentIndex + 1) % this.sessionOrder.length;
    return this.activeSession;
  }

  prevSession(): SessionMetadata | null {
    if (this.sessionOrder.length === 0) return null;
    this.currentIndex =
      this.currentIndex <= 0 ? this.sessionOrder.length - 1 : this.currentIndex - 1;
    return this.activeSession;
  }

  /**
   * Create new session from file content
   */
  createSession(
    editSession: Ace.EditSession,
    filename: string,
    filepath: string | null = null,
  ): SessionMetadata {
    const id = uuidv4();

    const metadata: SessionMetadata = {
      id,
      filename,
      filepath,
      isDirty: false,
      editSession,
      createdAt: Date.now(),
    };

    this.sessions.set(id, metadata);
    this.sessionOrder.push(id);
    this.currentIndex = this.sessionOrder.length - 1;

    return metadata;
  }

  /**
   * Close session and return next active session
   */
  closeSession(id: string): SessionMetadata | null {
    const index = this.sessionOrder.indexOf(id);
    if (index === -1) return this.activeSession;

    this.sessions.delete(id);
    this.sessionOrder.splice(index, 1);

    // Adjust current index
    if (this.sessionOrder.length === 0) {
      this.currentIndex = -1;
      return null;
    }

    if (index <= this.currentIndex) {
      this.currentIndex = Math.max(0, this.currentIndex - 1);
    }

    // If we closed the active tab, stay at same index (which now has next tab)
    // or go to last if we closed the last one
    if (this.currentIndex >= this.sessionOrder.length) {
      this.currentIndex = this.sessionOrder.length - 1;
    }

    return this.activeSession;
  }

  get sessionList(): SessionMetadata[] {
    return this.sessionOrder.map((id) => this.sessions.get(id)!);
  }

  get sessionIds(): string[] {
    return this.sessionOrder;
  }

  /**
   * Switch to specific session by ID
   */
  switchTo(id: string): boolean {
    const index = this.sessionOrder.indexOf(id);
    if (index !== -1) {
      this.currentIndex = index;
      return true;
    }
    return false;
  }
}

export default SessionManager;
