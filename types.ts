
export enum TaskStatus {
  TO_DO = 'Cần làm',
  IN_PROGRESS = 'Đang làm',
  COMPLETED = 'Hoàn thành'
}

export enum TaskComplexity {
  MEDIUM = 'Trung bình',
  HARD = 'Khó',
  VERY_HARD = 'Rất khó'
}

export enum Gender {
  MALE = 'Nam',
  FEMALE = 'Nữ'
}

export interface Attachment {
  name: string;
  type: string;
  data: string; // Base64 string
}

export interface User {
  id: string;
  name: string;
  position: string;
  unit: string;
  gender: Gender;
  dob: string;
  phone: string;
  email: string;
  password: string;    
  delegateLevel: string;
  notes: string;
  mustChangePassword: boolean;
}

export interface Task {
  id: string;
  userId: string;
  content: string;
  startTime: number;
  completedTime: number | null; // Bỏ dấu ? và dùng null tường minh
  status: TaskStatus;
  complexity: TaskComplexity;
  leadId: string;
  collaboratorIds: string[];
  unit: string;
  attachments?: Attachment[];
}

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  tasksByUnit: Record<string, number>;
}
