
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
  notes: string; // 'VT' for Văn thư, 'AD1'/'AD2' for Admin
  mustChangePassword: boolean;
}

export interface Document {
  id: string;
  refCode: string;       // Số ký hiệu
  docNumber: string;    // Số văn bản đến
  docDate: string;      // Ngày văn bản
  arrivalDate: string;  // Ngày đến
  senderUnit: string;   // Đơn vị gửi
  taxCode: string;      // Mã số thuế
  summary: string;      // Trích yếu
  deadline: string;     // Hạn xử lý
  notes: string;        // Ghi chú
  createdAt: number;
}

export interface Task {
  id: string;
  userId: string;
  content: string;
  startTime: number;
  deadline?: number; // Hạn chót (timestamp)
  completedTime?: number; 
  status: TaskStatus;
  complexity: TaskComplexity;
  leadId: string;
  collaboratorIds: string[];
  forwarderIds?: string[]; 
  unit: string;
  attachments?: Attachment[];
  documentId?: string; // Liên kết tới văn bản gốc
}

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number; 
  tasksByUnit: Record<string, number>;
}
