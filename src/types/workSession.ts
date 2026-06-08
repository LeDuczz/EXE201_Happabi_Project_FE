export type WorkSessionStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'PENDING_MOTHER_CONFIRMATION'
  | 'COMPLETED'
  | 'AUTO_CONFIRMED'
  | 'REPORTED'
  | 'CANCELLED';

export type WorkSessionChecklistStatus = 'PENDING' | 'COMPLETED';

export type WorkSessionEvidenceType = 'CHECK_IN' | 'CHECKLIST_ITEM';

export type WorkSessionEvidenceStatus = 'ACTIVE' | 'DELETE_PENDING' | 'DELETED';

export interface WorkSessionEvidence {
  id: string;
  evidenceType: WorkSessionEvidenceType;
  status: WorkSessionEvidenceStatus;
  previewUrl?: string;
  contentType?: string;
  fileSize?: number;
  createdAt?: string;
}

export interface WorkSessionChecklistItem {
  id: string;
  title: string;
  sortOrder: number;
  status: WorkSessionChecklistStatus;
  completedAt?: string;
  note?: string;
  evidences: WorkSessionEvidence[];
}

export interface WorkSession {
  id: string;
  bookingId: string;
  nurseProfileId: string;
  nurseName: string;
  motherId: string;
  motherName: string;
  serviceOfferingId: string;
  serviceName: string;
  status: WorkSessionStatus;
  scheduledStartAt: string;
  scheduledEndAt: string;
  checkedInAt?: string;
  lateMinutes: number;
  checkedOutAt?: string;
  autoConfirmAt?: string;
  confirmedAt?: string;
  reportedAt?: string;
  reportReason?: string;
  checkInEvidences: WorkSessionEvidence[];
  checklistItems: WorkSessionChecklistItem[];
}
