export interface Schedule {
  id: string;
  platform: string;
  content: string;
  productTitle: string;
  affiliateLink?: string;
  sourceUrl?: string;
}

export interface PublishTarget {
  id: string;
  platform: string;
  content: string;
  scheduledAt: Date;
}
