import {
  mockInstitution,
  mockUserAccounts,
  mockStudents,
  mockAdmissions,
  mockAttendanceRecords,
  mockLeaveRequests,
  mockFeeCategories,
  mockFeeStructures,
  mockStudentFeeLedgers,
  mockAnnouncements,
  mockMessages,
  mockClassSections,
  mockCollegeDepartments,
  mockActivityLog,
  mockChartData,
} from '../data/mockData';
import {
  InstitutionInfo,
  UserAccount,
  Student,
  AdmissionApplicant,
  AttendanceRecord,
  LeaveRequest,
  FeeCategory,
  FeeStructure,
  StudentFeeLedger,
  PaymentReceipt,
  Announcement,
  DirectMessage,
  ClassSectionUnit,
  CollegeDepartmentUnit,
  ActivityItem,
} from '../types/erp';

// In-memory writable stores
let institutionStore: InstitutionInfo = { ...mockInstitution };
let usersStore: UserAccount[] = [...mockUserAccounts];
let studentsStore: Student[] = [...mockStudents];
let admissionsStore: AdmissionApplicant[] = [...mockAdmissions];
let attendanceStore: AttendanceRecord[] = [...mockAttendanceRecords];
let leaveRequestsStore: LeaveRequest[] = [...mockLeaveRequests];
let feeCategoriesStore: FeeCategory[] = [...mockFeeCategories];
let feeStructuresStore: FeeStructure[] = [...mockFeeStructures];
let feeLedgersStore: StudentFeeLedger[] = [...mockStudentFeeLedgers];
let announcementsStore: Announcement[] = [...mockAnnouncements];
let messagesStore: DirectMessage[] = [...mockMessages];
let classSectionsStore: ClassSectionUnit[] = [...mockClassSections];
let collegeDeptsStore: CollegeDepartmentUnit[] = [...mockCollegeDepartments];
let activityStore: ActivityItem[] = [...mockActivityLog];

const delay = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

export const erpService = {
  // Institution
  async getInstitutionInfo(): Promise<InstitutionInfo> {
    await delay();
    return { ...institutionStore };
  },

  async updateInstitutionInfo(data: Partial<InstitutionInfo>): Promise<InstitutionInfo> {
    await delay();
    institutionStore = { ...institutionStore, ...data };
    return { ...institutionStore };
  },

  // Users & RBAC
  async getUsers(): Promise<UserAccount[]> {
    await delay();
    return [...usersStore];
  },

  async createUser(userData: Omit<UserAccount, 'id' | 'lastLogin'>): Promise<UserAccount> {
    await delay();
    const newUser: UserAccount = {
      ...userData,
      id: `usr-${Date.now()}`,
      lastLogin: 'Never',
    };
    usersStore = [newUser, ...usersStore];
    activityStore.unshift({
      id: `act-${Date.now()}`,
      title: 'User Account Provisioned',
      description: `New user ${newUser.name} created with role ${newUser.role}.`,
      timestamp: 'Just now',
      type: 'SECURITY',
      actorName: 'Admin',
    });
    return newUser;
  },

  async updateUser(id: string, updates: Partial<UserAccount>): Promise<UserAccount> {
    await delay();
    const idx = usersStore.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('User not found');
    usersStore[idx] = { ...usersStore[idx], ...updates };
    return usersStore[idx];
  },

  async toggleUserStatus(id: string): Promise<UserAccount> {
    await delay();
    const idx = usersStore.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('User not found');
    const newStatus = usersStore[idx].status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    usersStore[idx].status = newStatus;
    return usersStore[idx];
  },

  // Students
  async getStudents(): Promise<Student[]> {
    await delay();
    return [...studentsStore];
  },

  async getStudentById(id: string): Promise<Student | undefined> {
    await delay();
    return studentsStore.find((s) => s.id === id);
  },

  async createStudent(studentData: Omit<Student, 'id' | 'fullName'>): Promise<Student> {
    await delay();
    const newStudent: Student = {
      ...studentData,
      id: `st-${Date.now()}`,
      fullName: `${studentData.firstName} ${studentData.lastName}`,
    };
    studentsStore = [newStudent, ...studentsStore];
    activityStore.unshift({
      id: `act-${Date.now()}`,
      title: 'Student Admitted to SIS',
      description: `${newStudent.fullName} (${newStudent.admissionNumber}) enrolled in ${newStudent.className}.`,
      timestamp: 'Just now',
      type: 'ADMISSION',
      actorName: 'Admissions Office',
    });
    return newStudent;
  },

  async updateStudent(id: string, updates: Partial<Student>): Promise<Student> {
    await delay();
    const idx = studentsStore.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Student not found');
    const updated = { ...studentsStore[idx], ...updates };
    if (updates.firstName || updates.lastName) {
      updated.fullName = `${updated.firstName} ${updated.lastName}`;
    }
    studentsStore[idx] = updated;
    return updated;
  },

  async deleteStudent(id: string): Promise<boolean> {
    await delay();
    studentsStore = studentsStore.filter((s) => s.id !== id);
    return true;
  },

  // Admissions
  async getAdmissions(): Promise<AdmissionApplicant[]> {
    await delay();
    return [...admissionsStore];
  },

  async createAdmission(data: Omit<AdmissionApplicant, 'id' | 'applicationNumber' | 'submissionDate'>): Promise<AdmissionApplicant> {
    await delay();
    const newApp: AdmissionApplicant = {
      ...data,
      id: `adm-${Date.now()}`,
      applicationNumber: `APP-2026-${Math.floor(100 + Math.random() * 900)}`,
      submissionDate: new Date().toISOString().split('T')[0],
    };
    admissionsStore = [newApp, ...admissionsStore];
    activityStore.unshift({
      id: `act-${Date.now()}`,
      title: 'New Admission Application',
      description: `${newApp.applicantName} submitted application for ${newApp.applyingForClass}.`,
      timestamp: 'Just now',
      type: 'ADMISSION',
      actorName: 'Portal Intake',
    });
    return newApp;
  },

  async updateAdmissionStatus(id: string, status: AdmissionApplicant['status'], notes?: string): Promise<AdmissionApplicant> {
    await delay();
    const idx = admissionsStore.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Application not found');
    admissionsStore[idx].status = status;
    if (notes) admissionsStore[idx].notes = notes;

    activityStore.unshift({
      id: `act-${Date.now()}`,
      title: `Admission Status Updated: ${status}`,
      description: `${admissionsStore[idx].applicantName} application marked as ${status}.`,
      timestamp: 'Just now',
      type: 'ADMISSION',
      actorName: 'Admissions Lead',
    });
    return admissionsStore[idx];
  },

  // Attendance
  async getAttendanceRecords(date?: string, type?: 'STUDENT' | 'EMPLOYEE'): Promise<AttendanceRecord[]> {
    await delay();
    let records = [...attendanceStore];
    if (date) records = records.filter((r) => r.date === date);
    if (type) records = records.filter((r) => r.personType === type);
    return records;
  },

  async markAttendanceBatch(records: Omit<AttendanceRecord, 'id'>[]): Promise<AttendanceRecord[]> {
    await delay();
    const created: AttendanceRecord[] = records.map((r, i) => ({
      ...r,
      id: `att-${Date.now()}-${i}`,
    }));
    // Replace or append
    attendanceStore = [...created, ...attendanceStore];
    activityStore.unshift({
      id: `act-${Date.now()}`,
      title: 'Roll Call Marked & Signed',
      description: `Attendance recorded for ${records.length} individuals.`,
      timestamp: 'Just now',
      type: 'ATTENDANCE',
      actorName: 'Faculty / Staff',
    });
    return created;
  },

  async getLeaveRequests(): Promise<LeaveRequest[]> {
    await delay();
    return [...leaveRequestsStore];
  },

  async submitLeaveRequest(data: Omit<LeaveRequest, 'id' | 'appliedOn' | 'status'>): Promise<LeaveRequest> {
    await delay();
    const req: LeaveRequest = {
      ...data,
      id: `lv-${Date.now()}`,
      appliedOn: new Date().toISOString().split('T')[0],
      status: 'PENDING',
    };
    leaveRequestsStore = [req, ...leaveRequestsStore];
    return req;
  },

  async updateLeaveStatus(id: string, status: 'APPROVED' | 'REJECTED', reviewerName: string): Promise<LeaveRequest> {
    await delay();
    const idx = leaveRequestsStore.findIndex((l) => l.id === id);
    if (idx === -1) throw new Error('Leave request not found');
    leaveRequestsStore[idx].status = status;
    leaveRequestsStore[idx].reviewedBy = reviewerName;
    return leaveRequestsStore[idx];
  },

  // Finance & Fees
  async getFeeCategories(): Promise<FeeCategory[]> {
    await delay();
    return [...feeCategoriesStore];
  },

  async getFeeStructures(): Promise<FeeStructure[]> {
    await delay();
    return [...feeStructuresStore];
  },

  async createFeeStructure(data: Omit<FeeStructure, 'id'>): Promise<FeeStructure> {
    await delay();
    const newFs: FeeStructure = { ...data, id: `fs-${Date.now()}` };
    feeStructuresStore = [newFs, ...feeStructuresStore];
    return newFs;
  },

  async getStudentFeeLedgers(): Promise<StudentFeeLedger[]> {
    await delay();
    return [...feeLedgersStore];
  },

  async recordFeePayment(
    invoiceId: string,
    amountMinor: number,
    paymentMethod: PaymentReceipt['paymentMethod'],
    receivedBy: string
  ): Promise<{ ledger: StudentFeeLedger; receipt: PaymentReceipt }> {
    await delay();
    const idx = feeLedgersStore.findIndex((l) => l.id === invoiceId);
    if (idx === -1) throw new Error('Invoice not found');

    const ledger = feeLedgersStore[idx];
    const newPaid = ledger.paidMinor + amountMinor;
    const newDue = Math.max(0, ledger.totalMinor - newPaid);
    const newStatus = newDue === 0 ? 'PAID' : 'PARTIAL';

    const receipt: PaymentReceipt = {
      id: `rec-${Date.now()}`,
      receiptNumber: `RCP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      invoiceNumber: ledger.invoiceNumber,
      studentName: ledger.studentName,
      admissionNumber: ledger.admissionNumber,
      className: ledger.className,
      amountMinor,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod,
      transactionReference: `TXN-${paymentMethod.slice(0, 3)}-${Date.now().toString().slice(-6)}`,
      receivedBy,
      status: 'SUCCESS',
    };

    ledger.paidMinor = newPaid;
    ledger.dueMinor = newDue;
    ledger.status = newStatus;
    ledger.payments.unshift(receipt);

    activityStore.unshift({
      id: `act-${Date.now()}`,
      title: 'Fee Payment Collected',
      description: `$${(amountMinor / 100).toFixed(2)} received for ${ledger.studentName} (${ledger.invoiceNumber}).`,
      timestamp: 'Just now',
      type: 'FEE',
      actorName: receivedBy,
    });

    return { ledger, receipt };
  },

  // Announcements & Messages
  async getAnnouncements(): Promise<Announcement[]> {
    await delay();
    return [...announcementsStore];
  },

  async createAnnouncement(data: Omit<Announcement, 'id' | 'publishDate'>): Promise<Announcement> {
    await delay();
    const newAnn: Announcement = {
      ...data,
      id: `ann-${Date.now()}`,
      publishDate: new Date().toISOString().split('T')[0],
    };
    announcementsStore = [newAnn, ...announcementsStore];
    activityStore.unshift({
      id: `act-${Date.now()}`,
      title: 'Campus Announcement Published',
      description: `"${newAnn.title}" broadcast to ${newAnn.targetAudience}.`,
      timestamp: 'Just now',
      type: 'SYSTEM',
      actorName: newAnn.authorName,
    });
    return newAnn;
  },

  async getMessages(): Promise<DirectMessage[]> {
    await delay();
    return [...messagesStore];
  },

  async sendMessage(data: Omit<DirectMessage, 'id' | 'sentAt' | 'isUnread'>): Promise<DirectMessage> {
    await delay();
    const newMsg: DirectMessage = {
      ...data,
      id: `msg-${Date.now()}`,
      sentAt: 'Just now',
      isUnread: true,
    };
    messagesStore = [newMsg, ...messagesStore];
    return newMsg;
  },

  // Classes & Academics
  async getClassSections(): Promise<ClassSectionUnit[]> {
    await delay();
    return [...classSectionsStore];
  },

  async createClassSection(name: string, sequence: number, sectionName: string, room: string, teacher: string): Promise<ClassSectionUnit> {
    await delay();
    const newClass: ClassSectionUnit = {
      id: `cls-${Date.now()}`,
      className: name,
      sequenceOrder: sequence,
      levelType: 'SCHOOL',
      sections: [
        {
          id: `sec-${Date.now()}`,
          sectionName,
          roomNumber: room,
          classTeacher: teacher,
          studentCount: 0,
          capacity: 35,
        },
      ],
    };
    classSectionsStore = [...classSectionsStore, newClass];
    return newClass;
  },

  async getCollegeDepartments(): Promise<CollegeDepartmentUnit[]> {
    await delay();
    return [...collegeDeptsStore];
  },

  // Dashboard & Analytics
  async getDashboardSummary() {
    await delay();
    return {
      institution: institutionStore,
      totalStudents: studentsStore.length,
      totalStaff: usersStore.filter((u) => u.role !== 'Student' && u.role !== 'Parent').length,
      totalClasses: classSectionsStore.length + collegeDeptsStore.length,
      newAdmissions: admissionsStore.filter((a) => a.status === 'APPROVED' || a.status === 'PENDING').length,
      presentToday: attendanceStore.filter((a) => a.status === 'PRESENT').length,
      absentToday: attendanceStore.filter((a) => a.status === 'ABSENT').length,
      pendingFeesMinor: feeLedgersStore.reduce((acc, curr) => acc + curr.dueMinor, 0),
      totalCollectedMinor: feeLedgersStore.reduce((acc, curr) => acc + curr.paidMinor, 0),
      recentAdmissions: admissionsStore.slice(0, 5),
      recentAnnouncements: announcementsStore.slice(0, 4),
      recentActivities: activityStore.slice(0, 5),
      charts: mockChartData,
    };
  },
};
