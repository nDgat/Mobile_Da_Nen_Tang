export type AuditContext = {
  actorId: number;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
};
