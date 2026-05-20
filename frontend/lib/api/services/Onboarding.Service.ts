import { apiClient } from "../ApiClient";
import { BackendRoutes } from "../BackendRoutes";
import type { OrganizationInvitation } from "@/lib/api/types/organizations.types";
import type {
  GetOnboardingTokenResponse,
  EmailVerificationResponse,
  SetUsernameRequest,
  SetUsernameResponse,
  RegisterResponseType,
  CheckUsernameResponse,
  SetBasicInfoRequest,
  SetBasicInfoResponse,
  SetPasswordRequest,
  SetPasswordResponse,
  ExchangeOnboardingTokensRequest,
  ExchangeOnboardingTokensResponse,
} from "../types/auth";

/* -------------------- TYPES -------------------- */

interface GetOnboardingTokenIn {
  email: string;
  password: string;
}

interface SendEmailOtpIn {
  email: string;
}

interface CheckEmailOtpIn {
  email: string;
  otp: string;
}

interface OtpOut {
  detail: string;
  code: string;
}

/* -------------------- SERVICE -------------------- */

export class OnboardingService {
  /**
   * Authenticate a user who hasn't completed onboarding and receive an
   * onboarding token. Only works while onboarding is incomplete.
   */
  static async getOnboardingToken(
    data: GetOnboardingTokenIn
  ): Promise<GetOnboardingTokenResponse> {
    const res = await apiClient.post<GetOnboardingTokenResponse>(
      BackendRoutes.getOnboardingToken,
      data,
      { requiresAuth: false }
    );
    return res.data;
  }

  /** Send email verification OTP during onboarding */
  static async sendEmailOtp(data: SendEmailOtpIn): Promise<OtpOut> {
    const res = await apiClient.post<OtpOut>(
      BackendRoutes.onboardingSendEmailOtp,
      data,
      { requiresAuth: false }
    );
    return res.data;
  }

  /** Verify email OTP during onboarding. Advances onboarding on success. */
  static async checkEmailOtp(
    data: CheckEmailOtpIn
  ): Promise<EmailVerificationResponse> {
    const res = await apiClient.post<EmailVerificationResponse>(
      BackendRoutes.onboardingCheckEmailOtp,
      data,
      { requiresAuth: false }
    );
    return res.data;
  }

  /** Set username during onboarding. Requires onboarding token. */
  static async setUsername(data: SetUsernameRequest): Promise<SetUsernameResponse> {
    const res = await apiClient.post<SetUsernameResponse>(
      BackendRoutes.onboardingSetUsername,
      data,
      { requiresAuth: false }
    );
    return res.data;
  }

  /**
   * Upload profile picture during onboarding. Uses multipart/form-data.
   * Requires onboarding token. Advances onboarding on success.
   */
  static async setProfilePicture(
    onboardingToken: string,
    file: File
  ): Promise<RegisterResponseType> {
    const formData = new FormData();
    formData.append("onboarding_token", onboardingToken);
    formData.append("profile_picture", file);
    console.log("Uploading ...", { onboardingToken, file, formData });

    const res = await apiClient.post<RegisterResponseType>(
      BackendRoutes.onboardingSetProfilePicture,
      formData,
      {
        requiresAuth: false,
        headers: {
          // Let browser set Content-Type with boundary for FormData
          // "Content-Type": "multipart/form-data",
          "Content-Type": undefined as any,
        },
      }
    );
    return res.data;
  }

  /** Check if a username is available. Requires onboarding token to exclude current user. */
  static async checkUsername(username: string, onboardingToken: string): Promise<CheckUsernameResponse> {
    const res = await apiClient.post<CheckUsernameResponse>(
      BackendRoutes.checkUsername,
      { username, onboarding_token: onboardingToken },
      { requiresAuth: false }
    );
    return res.data;
  }

  /** Set basic info (first name, last name, password) during onboarding */
  static async setBasicInfo(data: SetBasicInfoRequest): Promise<SetBasicInfoResponse> {
    const res = await apiClient.post<SetBasicInfoResponse>(
      BackendRoutes.onboardingSetUserBasicInfo,
      data,
      { requiresAuth: false }
    );
    return res.data;
  }

  /** Set password during onboarding */
  static async setPassword(data: SetPasswordRequest): Promise<SetPasswordResponse> {
    const res = await apiClient.post<SetPasswordResponse>(
      BackendRoutes.onboardingSetPassword,
      data,
      { requiresAuth: false }
    );
    return res.data;
  }

  /** Exchange onboarding token for JWT auth tokens after completing onboarding */
  static async exchangeOnboardingTokens(data: ExchangeOnboardingTokensRequest): Promise<ExchangeOnboardingTokensResponse> {
    const res = await apiClient.post<ExchangeOnboardingTokensResponse>(
      BackendRoutes.onboardingExchangeTokens,
      data,
      { requiresAuth: false }
    );
    return res.data;
  }

  /** Get current user data during onboarding */
  static async getUserData(onboardingToken: string): Promise<RegisterResponseType> {
    const res = await apiClient.post<RegisterResponseType>(
      BackendRoutes.onboardingGetUserData,
      { onboarding_token: onboardingToken },
      { requiresAuth: false }
    );
    return res.data;
  }

  /** Create an organization during onboarding */
  static async createOrganization(onboardingToken: string, organizationName: string): Promise<SetBasicInfoResponse> {
    const res = await apiClient.post<SetBasicInfoResponse>(
      // backend returns updated onboarding_status
      BackendRoutes.onboardingCreateOrganization,
      { onboarding_token: onboardingToken, organization_name: organizationName },
      { requiresAuth: false }
    );
    return res.data;
  }

  /** Fetch pending organization invites for onboarding */
  static async fetchOrganizationInvites(
    onboardingToken: string
  ): Promise<{ organization_invites: OrganizationInvitation[] }> {
    const res = await apiClient.post<{ organization_invites: OrganizationInvitation[] }>(
      BackendRoutes.onboardingFetchOrganizationInvites,
      { onboarding_token: onboardingToken },
      { requiresAuth: false }
    );
    return res.data;
  }

  /** Accept or reject an organization invite during onboarding */
  static async acceptOrRejectOrganizationInvite(onboardingToken: string, organizationInviteId: string, action: "accept" | "decline") {
    const res = await apiClient.post<any>(
      BackendRoutes.onboardingAcceptOrRejectOrganizationInvite,
      { onboarding_token: onboardingToken, organization_invite_id: organizationInviteId, action },
      { requiresAuth: false }
    );
    return res.data;
  }
}

export default OnboardingService;
