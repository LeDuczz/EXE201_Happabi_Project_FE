export type NurseReviewTag =
  | 'ON_TIME'
  | 'PROFESSIONAL'
  | 'GENTLE_WITH_BABY'
  | 'CLEAR_COMMUNICATION'
  | 'CLEAN_AND_CAREFUL'
  | 'HELPFUL_GUIDANCE'
  | 'WOULD_BOOK_AGAIN';

export interface NurseReview {
  id: string;
  workSessionId: string;
  nurseProfileId: string;
  nurseName: string;
  rating: number;
  comment?: string;
  tags: NurseReviewTag[];
  createdAt: string;
}

export interface CreateNurseReviewPayload {
  rating: number;
  comment?: string;
  tags?: NurseReviewTag[];
}
