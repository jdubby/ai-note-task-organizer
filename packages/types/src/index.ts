// User Types
export interface User {
  _id: string;
  email: string;
  password?: string; // Only in server-side
  createdAt: Date;
  updatedAt: Date;
}

// Note Types
export interface Note {
  _id: string;
  userId: string;
  title: string;
  content: string;
  filePath?: string;
  fileName?: string;
  subject?: string;
  tags?: string[];
  isPrivate: boolean;
  category: 'work' | 'personal';
  aiMetadata?: AIMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateNoteInput {
  title: string;
  content: string;
  category?: 'work' | 'personal';
  isPrivate?: boolean;
  tags?: string[];
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  category?: 'work' | 'personal';
  isPrivate?: boolean;
  tags?: string[];
  subject?: string;
}

// Task Types
export interface Task {
  _id: string;
  userId: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  dueDate?: Date;
  noteId: string;
  subject?: string;
  isPrivate: boolean;
  category: 'work' | 'personal';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskInput {
  description: string;
  noteId?: string;
  status?: 'pending' | 'in-progress' | 'completed';
  dueDate?: Date;
  category?: 'work' | 'personal';
  isPrivate?: boolean;
  subject?: string;
}

export interface UpdateTaskInput {
  description?: string;
  status?: 'pending' | 'in-progress' | 'completed';
  dueDate?: Date;
  category?: 'work' | 'personal';
  isPrivate?: boolean;
  subject?: string;
}

// AI Types
export interface AIMetadata {
  model: string;
  confidence: number;
  processingTime: number;
  version: string;
}

export interface AIProcessingResult {
  subject: string;
  tasks: string[];
  tags: string[];
  confidence: number;
  method: 'ai' | 'fallback'; // Indicates which extraction method was used
  model?: string; // Model name if AI was used
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, 'password'>;
}

// Upload Types
export interface UploadResult {
  note: Note;
  tasks: Task[];
}

export interface FileUploadMetadata {
  fileName: string;
  fileSize: number;
  mimeType: string;
  category?: 'work' | 'personal';
  isPrivate?: boolean;
}

