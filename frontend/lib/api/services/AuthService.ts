import { apiClient } from "../ApiClient";
import { BackendRoutes } from "../BackendRoutes";
import { 
    LoginCredentialsType,
    OAuthLoginResponse,
    RawOAuthLoginResponse 
} from "../types";



export class AuthService {
    static async login(credentials: LoginCredentialsType): Promise<OAuthLoginResponse> {
        const res = await apiClient.post<RawOAuthLoginResponse>(
            BackendRoutes.auth.login, 
            credentials,
            { requiresAuth: false }
        );
        return res.data;
    }
}