-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM (
  'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PASSWORD_CHANGE', 'ROLE_CHANGE', 
  'PERMISSION_GRANTED', 'PERMISSION_REVOKED', 'USER_CREATED', 'USER_UPDATED', 
  'USER_DELETED', 'USER_BANNED', 'USER_UNBANNED', 'GAME_STARTED', 
  'GAME_JOINED', 'GAME_LEFT', 'GAME_FINISHED', 'CHEAT_DETECTED', 
  'MOVE_VALIDATED', 'MOVE_REJECTED', 'ADMIN_ACCESS_GRANTED', 
  'ADMIN_ACCESS_DENIED', 'SYSTEM_CONFIG_CHANGED', 'BULK_OPERATION', 
  'PDF_UPLOADED', 'PDF_PROCESSED', 'PDF_DELETED', 'FIELD_EXTRACTED', 
  'FIELD_UPDATED', 'SUSPICIOUS_ACTIVITY', 'RATE_LIMIT_EXCEEDED', 
  'INVALID_REQUEST', 'UNAUTHORIZED_ACCESS'
);

-- CreateEnum
CREATE TYPE "AuditSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "session_id" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "action" "AuditAction" NOT NULL,
    "resource" TEXT,
    "resource_id" TEXT,
    "description" TEXT NOT NULL,
    "severity" "AuditSeverity" NOT NULL DEFAULT 'MEDIUM',
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_severity_idx" ON "audit_logs"("severity");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "audit_logs_resource_resource_id_idx" ON "audit_logs"("resource", "resource_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_action_idx" ON "audit_logs"("user_id", "action");

-- CreateIndex
CREATE INDEX "audit_logs_severity_created_at_idx" ON "audit_logs"("severity", "created_at");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
