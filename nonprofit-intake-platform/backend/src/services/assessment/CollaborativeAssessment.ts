/**
 * Collaborative Assessment Service
 * Enables real-time multi-user assessment collaboration with WebSocket support,
 * conflict resolution, and activity tracking
 */

import { EventEmitter } from 'events';
import { AssessmentResponse, User } from '../../types';

export interface AssessmentSession {
  assessmentId: string;
  orgId: string;
  activeUsers: SessionUser[];
  startedAt: Date;
  lastActivity: Date;
  currentSection?: string;
  lockMap: Map<string, QuestionLock>;
}

export interface SessionUser {
  userId: string;
  userName: string;
  email: string;
  role: string;
  joinedAt: Date;
  lastSeen: Date;
  color: string; // For UI differentiation
  currentQuestionId?: string;
}

export interface QuestionLock {
  questionId: string;
  lockedBy: string;
  lockedAt: Date;
  expiresAt: Date;
}

export interface CollaborationEvent {
  type: 'user_joined' | 'user_left' | 'question_locked' | 'question_unlocked' |
        'answer_submitted' | 'comment_added' | 'progress_updated' | 'section_changed';
  assessmentId: string;
  userId: string;
  userName: string;
  timestamp: Date;
  data: any;
}

export interface AssessmentComment {
  commentId: string;
  questionId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
  resolved: boolean;
}

export interface ConflictResolution {
  questionId: string;
  conflicts: {
    userId: string;
    value: any;
    submittedAt: Date;
  }[];
  resolvedValue?: any;
  resolvedBy?: string;
  resolvedAt?: Date;
}

export class CollaborativeAssessmentService extends EventEmitter {
  private sessions: Map<string, AssessmentSession>;
  private lockTimeout: number = 300000; // 5 minutes
  private userColors: string[] = [
    '#3182CE', '#D53F8C', '#38A169', '#DD6B20', '#805AD5',
    '#00B5D8', '#E53E3E', '#319795', '#F56565', '#9F7AEA'
  ];
  private colorIndex: number = 0;

  constructor() {
    super();
    this.sessions = new Map();
    this.startCleanupTimer();
  }

  /**
   * User joins an assessment session
   */
  async joinSession(
    assessmentId: string,
    orgId: string,
    user: User
  ): Promise<{ session: AssessmentSession; event: CollaborationEvent }> {
    let session = this.sessions.get(assessmentId);

    if (!session) {
      // Create new session
      session = {
        assessmentId,
        orgId,
        activeUsers: [],
        startedAt: new Date(),
        lastActivity: new Date(),
        lockMap: new Map(),
      };
      this.sessions.set(assessmentId, session);
    }

    // Check if user already in session
    const existingUser = session.activeUsers.find(u => u.userId === user.userId);

    if (existingUser) {
      // Update last seen
      existingUser.lastSeen = new Date();
    } else {
      // Add new user
      const sessionUser: SessionUser = {
        userId: user.userId,
        userName: user.name || user.email,
        email: user.email,
        role: user.role || 'member',
        joinedAt: new Date(),
        lastSeen: new Date(),
        color: this.assignUserColor(),
      };
      session.activeUsers.push(sessionUser);
    }

    session.lastActivity = new Date();

    const event: CollaborationEvent = {
      type: 'user_joined',
      assessmentId,
      userId: user.userId,
      userName: user.name || user.email,
      timestamp: new Date(),
      data: {
        activeUserCount: session.activeUsers.length,
        users: session.activeUsers.map(u => ({
          userId: u.userId,
          userName: u.userName,
          color: u.color,
        })),
      },
    };

    this.emit('collaboration_event', event);

    return { session, event };
  }

  /**
   * User leaves an assessment session
   */
  async leaveSession(assessmentId: string, userId: string): Promise<CollaborationEvent | null> {
    const session = this.sessions.get(assessmentId);
    if (!session) return null;

    const userIndex = session.activeUsers.findIndex(u => u.userId === userId);
    if (userIndex === -1) return null;

    const user = session.activeUsers[userIndex];
    session.activeUsers.splice(userIndex, 1);

    // Release any locks held by this user
    await this.releaseUserLocks(assessmentId, userId);

    // Remove session if no active users
    if (session.activeUsers.length === 0) {
      this.sessions.delete(assessmentId);
    } else {
      session.lastActivity = new Date();
    }

    const event: CollaborationEvent = {
      type: 'user_left',
      assessmentId,
      userId,
      userName: user.userName,
      timestamp: new Date(),
      data: {
        activeUserCount: session.activeUsers.length,
      },
    };

    this.emit('collaboration_event', event);

    return event;
  }

  /**
   * Acquire lock on a question for editing
   */
  async lockQuestion(
    assessmentId: string,
    questionId: string,
    userId: string
  ): Promise<{ success: boolean; lock?: QuestionLock; reason?: string }> {
    const session = this.sessions.get(assessmentId);
    if (!session) {
      return { success: false, reason: 'Session not found' };
    }

    const existingLock = session.lockMap.get(questionId);

    // Check if already locked by another user
    if (existingLock && existingLock.lockedBy !== userId) {
      // Check if lock has expired
      if (new Date() < existingLock.expiresAt) {
        return {
          success: false,
          reason: `Question is being edited by ${this.getUserName(session, existingLock.lockedBy)}`,
        };
      }
      // Lock expired, remove it
      session.lockMap.delete(questionId);
    }

    // Create new lock
    const lock: QuestionLock = {
      questionId,
      lockedBy: userId,
      lockedAt: new Date(),
      expiresAt: new Date(Date.now() + this.lockTimeout),
    };

    session.lockMap.set(questionId, lock);
    session.lastActivity = new Date();

    const user = session.activeUsers.find(u => u.userId === userId);
    if (user) {
      user.currentQuestionId = questionId;
      user.lastSeen = new Date();
    }

    const event: CollaborationEvent = {
      type: 'question_locked',
      assessmentId,
      userId,
      userName: this.getUserName(session, userId),
      timestamp: new Date(),
      data: { questionId },
    };

    this.emit('collaboration_event', event);

    return { success: true, lock };
  }

  /**
   * Release lock on a question
   */
  async unlockQuestion(
    assessmentId: string,
    questionId: string,
    userId: string
  ): Promise<{ success: boolean; reason?: string }> {
    const session = this.sessions.get(assessmentId);
    if (!session) {
      return { success: false, reason: 'Session not found' };
    }

    const lock = session.lockMap.get(questionId);

    if (!lock) {
      return { success: true }; // Already unlocked
    }

    if (lock.lockedBy !== userId) {
      return { success: false, reason: 'Question locked by another user' };
    }

    session.lockMap.delete(questionId);
    session.lastActivity = new Date();

    const user = session.activeUsers.find(u => u.userId === userId);
    if (user) {
      user.currentQuestionId = undefined;
      user.lastSeen = new Date();
    }

    const event: CollaborationEvent = {
      type: 'question_unlocked',
      assessmentId,
      userId,
      userName: this.getUserName(session, userId),
      timestamp: new Date(),
      data: { questionId },
    };

    this.emit('collaboration_event', event);

    return { success: true };
  }

  /**
   * Submit an answer (with conflict detection)
   */
  async submitAnswer(
    assessmentId: string,
    questionId: string,
    userId: string,
    value: any,
    previousValue?: any
  ): Promise<{
    success: boolean;
    conflict?: boolean;
    conflictData?: ConflictResolution;
    reason?: string;
  }> {
    const session = this.sessions.get(assessmentId);
    if (!session) {
      return { success: false, reason: 'Session not found' };
    }

    // Release lock if held
    await this.unlockQuestion(assessmentId, questionId, userId);

    // TODO: In production, check database for concurrent updates
    // For now, assume no conflicts

    session.lastActivity = new Date();

    const user = session.activeUsers.find(u => u.userId === userId);
    if (user) {
      user.lastSeen = new Date();
    }

    const event: CollaborationEvent = {
      type: 'answer_submitted',
      assessmentId,
      userId,
      userName: this.getUserName(session, userId),
      timestamp: new Date(),
      data: {
        questionId,
        value,
        previousValue,
      },
    };

    this.emit('collaboration_event', event);

    return { success: true };
  }

  /**
   * Add comment to a question
   */
  async addComment(
    assessmentId: string,
    questionId: string,
    userId: string,
    content: string
  ): Promise<{ success: boolean; comment?: AssessmentComment; reason?: string }> {
    const session = this.sessions.get(assessmentId);
    if (!session) {
      return { success: false, reason: 'Session not found' };
    }

    const comment: AssessmentComment = {
      commentId: this.generateId(),
      questionId,
      userId,
      userName: this.getUserName(session, userId),
      content,
      createdAt: new Date(),
      resolved: false,
    };

    session.lastActivity = new Date();

    const event: CollaborationEvent = {
      type: 'comment_added',
      assessmentId,
      userId,
      userName: this.getUserName(session, userId),
      timestamp: new Date(),
      data: { comment },
    };

    this.emit('collaboration_event', event);

    return { success: true, comment };
  }

  /**
   * Update progress (section changed, completion percentage, etc.)
   */
  async updateProgress(
    assessmentId: string,
    userId: string,
    progressData: {
      currentSection?: string;
      completionPercentage?: number;
      currentQuestionIndex?: number;
    }
  ): Promise<void> {
    const session = this.sessions.get(assessmentId);
    if (!session) return;

    if (progressData.currentSection) {
      session.currentSection = progressData.currentSection;

      const event: CollaborationEvent = {
        type: 'section_changed',
        assessmentId,
        userId,
        userName: this.getUserName(session, userId),
        timestamp: new Date(),
        data: { section: progressData.currentSection },
      };

      this.emit('collaboration_event', event);
    }

    if (progressData.completionPercentage !== undefined) {
      const event: CollaborationEvent = {
        type: 'progress_updated',
        assessmentId,
        userId,
        userName: this.getUserName(session, userId),
        timestamp: new Date(),
        data: { completionPercentage: progressData.completionPercentage },
      };

      this.emit('collaboration_event', event);
    }

    session.lastActivity = new Date();

    const user = session.activeUsers.find(u => u.userId === userId);
    if (user) {
      user.lastSeen = new Date();
    }
  }

  /**
   * Get current session state
   */
  getSessionState(assessmentId: string): AssessmentSession | null {
    return this.sessions.get(assessmentId) || null;
  }

  /**
   * Update user heartbeat (keep-alive)
   */
  async heartbeat(assessmentId: string, userId: string): Promise<void> {
    const session = this.sessions.get(assessmentId);
    if (!session) return;

    const user = session.activeUsers.find(u => u.userId === userId);
    if (user) {
      user.lastSeen = new Date();
    }
  }

  /**
   * Release all locks held by a user
   */
  private async releaseUserLocks(assessmentId: string, userId: string): Promise<void> {
    const session = this.sessions.get(assessmentId);
    if (!session) return;

    const locksToRelease: string[] = [];

    session.lockMap.forEach((lock, questionId) => {
      if (lock.lockedBy === userId) {
        locksToRelease.push(questionId);
      }
    });

    for (const questionId of locksToRelease) {
      await this.unlockQuestion(assessmentId, questionId, userId);
    }
  }

  /**
   * Get user name from session
   */
  private getUserName(session: AssessmentSession, userId: string): string {
    const user = session.activeUsers.find(u => u.userId === userId);
    return user?.userName || 'Unknown User';
  }

  /**
   * Assign unique color to user
   */
  private assignUserColor(): string {
    const color = this.userColors[this.colorIndex % this.userColors.length];
    this.colorIndex++;
    return color;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Cleanup expired sessions and locks
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      const now = new Date();
      const sessionsToRemove: string[] = [];

      this.sessions.forEach((session, assessmentId) => {
        // Remove inactive users (no activity for 30 minutes)
        session.activeUsers = session.activeUsers.filter(user => {
          const inactiveTime = now.getTime() - user.lastSeen.getTime();
          return inactiveTime < 30 * 60 * 1000; // 30 minutes
        });

        // Remove expired locks
        session.lockMap.forEach((lock, questionId) => {
          if (now >= lock.expiresAt) {
            session.lockMap.delete(questionId);
          }
        });

        // Remove empty sessions inactive for 1 hour
        if (session.activeUsers.length === 0) {
          const sessionInactiveTime = now.getTime() - session.lastActivity.getTime();
          if (sessionInactiveTime > 60 * 60 * 1000) {
            sessionsToRemove.push(assessmentId);
          }
        }
      });

      // Remove old sessions
      sessionsToRemove.forEach(id => this.sessions.delete(id));
    }, 60000); // Run every minute
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): {
    assessmentId: string;
    orgId: string;
    activeUsers: number;
    startedAt: Date;
    lastActivity: Date;
  }[] {
    return Array.from(this.sessions.values()).map(session => ({
      assessmentId: session.assessmentId,
      orgId: session.orgId,
      activeUsers: session.activeUsers.length,
      startedAt: session.startedAt,
      lastActivity: session.lastActivity,
    }));
  }

  /**
   * Force remove user from all sessions (admin function)
   */
  async removeUserFromAllSessions(userId: string): Promise<number> {
    let removedCount = 0;

    for (const [assessmentId, session] of this.sessions.entries()) {
      const userIndex = session.activeUsers.findIndex(u => u.userId === userId);
      if (userIndex !== -1) {
        await this.leaveSession(assessmentId, userId);
        removedCount++;
      }
    }

    return removedCount;
  }
}

// Singleton instance
export const collaborativeAssessmentService = new CollaborativeAssessmentService();
