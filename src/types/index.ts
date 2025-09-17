export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'user';
  fullName: string;
  email: string;
  createdAt: string;
  isActive: boolean;
}

export interface PrintRequest {
  id: string;
  userId: string;
  userName: string;
  reason: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
  notes?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}