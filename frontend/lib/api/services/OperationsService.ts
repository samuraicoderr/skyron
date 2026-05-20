import { apiClient } from "../ApiClient";
import { BackendRoutes } from "../BackendRoutes";
import type {
  Chapter,
  DailyLog,
  FinancialReport,
  OperationSummary,
  Artifact,
  PaymentEntry,
  PayoutBatch,
  Payment,
  ProductivityReport,
  Project,
  TeamMember,
} from "@/lib/operations/types";

export class OperationsService {
  static requireOrganization(organizationId?: string): string {
    if (!organizationId) {
      throw new Error("Select an organization before loading operations data.");
    }
    return organizationId;
  }

  static async summary(organizationId?: string): Promise<OperationSummary> {
    const orgId = this.requireOrganization(organizationId);
    const res = await apiClient.get<OperationSummary>(BackendRoutes.operations.summary(orgId), {
      requiresAuth: true,
    });
    return res.data;
  }

  static async projects(organizationId?: string, params?: { search?: string; status?: string; page?: number }): Promise<Project[]> {
    const orgId = this.requireOrganization(organizationId);
    const res = await apiClient.get<Project[]>(BackendRoutes.operations.projects(orgId), {
      requiresAuth: true,
      params,
    });
    return res.data;
  }

  static async project(organizationId: string | undefined, id: string): Promise<Project> {
    const orgId = this.requireOrganization(organizationId);
    const res = await apiClient.get<Project>(BackendRoutes.operations.project(orgId, id), {
      requiresAuth: true,
    });
    return res.data;
  }

  static async chapters(organizationId?: string, params?: { status?: string; assignee?: string; project?: string }): Promise<Chapter[]> {
    const orgId = this.requireOrganization(organizationId);
    const res = await apiClient.get<Chapter[]>(BackendRoutes.operations.chapters(orgId), {
      requiresAuth: true,
      params,
    });
    return res.data;
  }

  static async chapter(organizationId: string | undefined, id: string): Promise<Chapter> {
    const orgId = this.requireOrganization(organizationId);
    const res = await apiClient.get<Chapter>(BackendRoutes.operations.chapter(orgId, id), {
      requiresAuth: true,
    });
    return res.data;
  }

  static async logs(params?: { project?: string; user?: string; from?: string; to?: string }): Promise<DailyLog[]> {
    const res = await apiClient.get<DailyLog[]>(BackendRoutes.operations.logs, {
      requiresAuth: true,
      params,
    });
    return res.data;
  }

  static async artifacts(organizationId?: string, params?: { status?: string; type?: string; project?: string; chapter?: string }): Promise<Artifact[]> {
    const orgId = this.requireOrganization(organizationId);
    const res = await apiClient.get<Artifact[]>(BackendRoutes.operations.artifacts(orgId), {
      requiresAuth: true,
      params,
    });
    return res.data;
  }

  static async paymentEntries(organizationId?: string, params?: { status?: string; user?: string; artifact?: string }): Promise<PaymentEntry[]> {
    const orgId = this.requireOrganization(organizationId);
    const res = await apiClient.get<PaymentEntry[]>(BackendRoutes.operations.paymentEntries(orgId), {
      requiresAuth: true,
      params,
    });
    return res.data;
  }

  static async payoutBatches(organizationId?: string): Promise<PayoutBatch[]> {
    const orgId = this.requireOrganization(organizationId);
    const res = await apiClient.get<PayoutBatch[]>(BackendRoutes.operations.payoutBatches(orgId), {
      requiresAuth: true,
    });
    return res.data;
  }

  static async payments(params?: { status?: string; user?: string; period?: string }): Promise<Payment[]> {
    const res = await apiClient.get<Payment[]>(BackendRoutes.operations.payments, {
      requiresAuth: true,
      params,
    });
    return res.data;
  }

  static async payment(id: string): Promise<Payment> {
    const res = await apiClient.get<Payment>(BackendRoutes.operations.payment(id), {
      requiresAuth: true,
    });
    return res.data;
  }

  static async team(): Promise<TeamMember[]> {
    const res = await apiClient.get<TeamMember[]>(BackendRoutes.operations.team, {
      requiresAuth: true,
    });
    return res.data;
  }

  static async productivityReport(): Promise<ProductivityReport> {
    const res = await apiClient.get<ProductivityReport>(BackendRoutes.operations.reports.productivity, {
      requiresAuth: true,
    });
    return res.data;
  }

  static async financialReport(): Promise<FinancialReport> {
    const res = await apiClient.get<FinancialReport>(BackendRoutes.operations.reports.financial, {
      requiresAuth: true,
    });
    return res.data;
  }
}

export default OperationsService;
