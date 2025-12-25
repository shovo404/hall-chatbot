
export type Role = 'Admin' | 'User' | null;

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface KnowledgeItem {
  id: string;
  type: 'file' | 'url';
  name: string;
  content: string;
  source: string;
  addedAt: Date;
}

export interface AuthState {
  role: Role;
  isAuthenticated: boolean;
}
