export type UserRole =
  | 'Super Admin'
  | 'Administrator'
  | 'Principal'
  | 'Teacher'
  | 'Accountant'
  | 'HR Manager'
  | 'Student'
  | 'Parent';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  designation?: string;
  idNumber: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  lastLogin: string;
  phone: string;
  permissions: string[];
}

export interface InstitutionInfo {
  name: string;
  code: string;
  tagline: string;
  type: 'SCHOOL' | 'COLLEGE' | 'HYBRID';
  logo: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  affiliationNumber: string;
  establishedYear: number;
  currentAcademicYear: string;
  currentTerm: string;
  principalName: string;
  totalStudents: number;
  totalStaff: number;
  campusArea: string;
}

export interface Student {
  id: string;
  admissionNumber: string;
  rollNumber: string;
  firstName: string;
  lastName: string;
  fullName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dob: string;
  bloodGroup: string;
  cohortType: 'SCHOOL' | 'COLLEGE';
  className: string; // e.g. "Grade 10" or "B.Tech CSE"
  sectionName: string; // e.g. "Section A" or "Sem 4"
  email: string;
  phone: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  residentialAddress: string;
  status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'TRANSFERRED';
  admissionDate: string;
  academicYear: string;
  attendancePercentage: number;
  feeStatus: 'PAID' | 'PARTIAL' | 'PENDING';
  cgpaOrGrade: string;
  avatar?: string;
  documents: { name: string; type: string; status: 'VERIFIED' | 'PENDING' }[];
}

export interface AdmissionApplicant {
  id: string;
  applicationNumber: string;
  applicantName: string;
  applyingForClass: string;
  cohortType: 'SCHOOL' | 'COLLEGE';
  submissionDate: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  parentName: string;
  parentContact: string;
  email: string;
  previousSchoolOrCollege: string;
  entranceExamScore?: number;
  documentsVerified: boolean;
  assignedSection?: string;
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  personId: string;
  personName: string;
  personType: 'STUDENT' | 'EMPLOYEE';
  rollOrEmpId: string;
  className?: string;
  sectionName?: string;
  department?: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';
  remarks?: string;
}

export interface LeaveRequest {
  id: string;
  applicantName: string;
  applicantRole: 'STUDENT' | 'TEACHER' | 'STAFF';
  idNumber: string;
  leaveType: 'SICK' | 'CASUAL' | 'EMERGENCY' | 'ACADEMIC';
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  appliedOn: string;
  reviewedBy?: string;
}

export interface FeeCategory {
  id: string;
  name: string;
  code: string;
  description: string;
  frequency: 'ANNUAL' | 'TERM' | 'MONTHLY' | 'ONE_TIME';
}

export interface FeeStructure {
  id: string;
  title: string;
  classOrProgram: string;
  academicYear: string;
  totalAmountMinor: number; // in cents/paise ($1500 = 150000)
  dueDate: string;
  categories: { categoryName: string; amountMinor: number }[];
}

export interface StudentFeeLedger {
  id: string;
  invoiceNumber: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  totalMinor: number;
  paidMinor: number;
  dueMinor: number;
  dueDate: string;
  status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE';
  discountMinor: number;
  items: { id: string; name: string; amountMinor: number; paidMinor: number }[];
  payments: PaymentReceipt[];
}

export interface PaymentReceipt {
  id: string;
  receiptNumber: string;
  invoiceNumber: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  amountMinor: number;
  paymentDate: string;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'UPI';
  transactionReference: string;
  receivedBy: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  targetAudience: 'ALL' | 'STUDENTS' | 'PARENTS' | 'TEACHERS' | 'STAFF';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  publishDate: string;
  expiryDate?: string;
  authorName: string;
  authorRole: string;
  attachmentName?: string;
  isRead?: boolean;
}

export interface DirectMessage {
  id: string;
  senderName: string;
  senderRole: string;
  senderAvatar?: string;
  recipientName: string;
  subject: string;
  preview: string;
  fullBody: string;
  sentAt: string;
  isUnread: boolean;
  priority: 'NORMAL' | 'IMPORTANT';
}

export interface ClassSectionUnit {
  id: string;
  className: string;
  sequenceOrder: number;
  levelType: 'SCHOOL' | 'COLLEGE';
  sections: {
    id: string;
    sectionName: string;
    roomNumber: string;
    classTeacher: string;
    studentCount: number;
    capacity: number;
  }[];
}

export interface CollegeDepartmentUnit {
  id: string;
  name: string;
  code: string;
  headOfDepartment: string;
  programsCount: number;
  coursesCount: number;
  facultyCount: number;
  studentCount: number;
  courses: {
    code: string;
    title: string;
    credits: number;
    semester: number;
    faculty: string;
  }[];
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'ADMISSION' | 'FEE' | 'ATTENDANCE' | 'SYSTEM' | 'SECURITY';
  actorName: string;
}
