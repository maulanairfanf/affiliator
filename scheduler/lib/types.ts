export interface Schedule {
  id: string;
  platform: string;
  content: string;
  productTitle: string;
}

export interface PublishTarget {
  id: string;
  platform: string;
  content: string;
  scheduledAt: Date;
}
