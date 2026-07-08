import type { Platform, ScheduleStatus } from "@/lib/constants";

export interface Schedule {
  id: string;
  userId: string;
  productId: string;
  contentId: string;
  platform: Platform;
  scheduledAt: string;
  status: ScheduleStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleFilter {
  status?: ScheduleStatus;
  platform?: Platform;
  startDate?: string;
  endDate?: string;
}

export interface ScheduleFormData {
  productId: string;
  contentId: string;
  platform: Platform;
  scheduledAt: string;
}
