import Nylas from "nylas";
import {
  AuthResult,
  DeepLinkOptions,
  NylasConfig,
  NylasCredentials,
} from "./types";

export class NylasAuth {
  private nylas: Nylas;
  private config: NylasConfig;
  private deepLinkOptions?: DeepLinkOptions;

  constructor(config: NylasConfig, deepLinkOptions?: DeepLinkOptions) {
    this.config = config;
    this.deepLinkOptions = deepLinkOptions;

    this.nylas = new Nylas({
      apiKey: config.clientSecret,
      apiUri: config.apiUri,
    });
  }

  /**
   * Get the authorization URL for OAuth flow
   */
  getAuthUrl(): string {
    return this.nylas.auth.urlForOAuth2({
      clientId: this.config.clientId,
      redirectUri: this.config.redirectUri,
    });
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<NylasCredentials> {
    const response = await this.nylas.auth.exchangeCodeForToken({
      code,
      clientSecret: this.config.clientSecret,
      clientId: this.config.clientId,
      redirectUri: this.config.redirectUri,
    });

    return {
      grantId: response.grantId,
      accessToken: response.accessToken,
      email: response.email,
      provider: response.provider || "unknown",
      expiresIn: response.expiresIn,
      idToken: response.idToken,
      tokenType: response.tokenType,
      scope: response.scope,
    };
  }

  /**
   * Generate a deep link with auth result for mobile apps
   */
  generateDeepLink(result: AuthResult): string | null {
    if (!this.deepLinkOptions) {
      return null;
    }

    const { baseUrl, additionalParams = {} } = this.deepLinkOptions;
    const jsonData = encodeURIComponent(JSON.stringify(result));

    let url = `${baseUrl}?json=${jsonData}`;

    // Add any additional parameters
    Object.entries(additionalParams).forEach(([key, value]) => {
      url += `&${key}=${encodeURIComponent(value)}`;
    });

    return url;
  }

  /**
   * Handle the OAuth callback for mobile apps
   * This is typically used in a redirect handler
   */
  async handleOAuthCallback(code: string | null): Promise<AuthResult> {
    if (!code) {
      return {
        success: false,
        error: {
          type: "USER_NOT_AUTHORIZED",
          message: "Calendar connection has been denied.",
        },
      };
    }

    try {
      const credentials = await this.exchangeCodeForToken(code);
      return {
        success: true,
        credentials,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          type: "EXCHANGE_CODE_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to exchange code for token",
        },
      };
    }
  }
}
