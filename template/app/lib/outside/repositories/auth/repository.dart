import 'dart:io';

import 'package:google_sign_in/google_sign_in.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../app/configurations/configuration.dart';
import '../../client_providers/sentry/client_provider.dart';
import '../../effect_providers/mixpanel/effect_provider.dart';
import '../base.dart';

class Auth_Repository extends Repository_Base {
  Auth_Repository({
    required String deepLinkBaseUri,
    required OauthConfiguration oauthConfiguration,
    required Mixpanel_EffectProvider mixpanelEffectProvider,
    required Sentry_ClientProvider sentryClientProvider,
    required SupabaseClient supabaseClient,
  })  : _deepLinkBaseUri = deepLinkBaseUri,
        _oauthConfiguration = oauthConfiguration,
        _mixpanelEffectProvider = mixpanelEffectProvider,
        _sentryClientProvider = sentryClientProvider,
        _supabaseClient = supabaseClient;

  final String _deepLinkBaseUri;
  final OauthConfiguration _oauthConfiguration;
  final Mixpanel_EffectProvider _mixpanelEffectProvider;
  final Sentry_ClientProvider _sentryClientProvider;
  final SupabaseClient _supabaseClient;
  String get _signUpRedirectUrl => '''$_deepLinkBaseUri/#/deep/verify-email/''';
  String get _resetPasswordRedirectUrl =>
      '''$_deepLinkBaseUri/#/deep/reset-password/''';

  @override
  Future<void> init() async {}

  Future<void> updatesUsersInClients() async {
    final user = getCurrentUser();
    final email = user?.email;
    final id = user?.id;

    await _sentryClientProvider.setUserId(userId: id);
    _mixpanelEffectProvider.getEffect().setUser(sub: id, email: email);
  }

  User? getCurrentUser() {
    return _supabaseClient.auth.currentUser;
  }

  Future<void> signIn({
    required String email,
    required String password,
  }) async {
    log.info('signIn');
    log.fine('email: $email');

    await _supabaseClient.auth.signInWithPassword(
      email: email,
      password: password,
    );
  }

  Future<void> signOut() async {
    log.info('signOut');

    await _supabaseClient.auth.signOut();
  }

  Future<void> signInWithGoogle() async {
    final googleUser = await GoogleSignIn(
      clientId: Platform.isIOS
          ? _oauthConfiguration.iosClientId
          : _oauthConfiguration.androidClientId,
      serverClientId: _oauthConfiguration.webClientId,
    ).signIn();
    final googleAuth = await googleUser!.authentication;

    await _supabaseClient.auth.signInWithIdToken(
      provider: OAuthProvider.google,
      idToken: googleAuth.idToken!,
      accessToken: googleAuth.accessToken,
    );
  }

  Future<void> signUp({
    required String email,
    required String password,
  }) async {
    log.info('signUp');
    log.fine('email: $email');
    log.fine('redirectTo: $_signUpRedirectUrl');

    await _supabaseClient.auth.signUp(
      email: email,
      emailRedirectTo: _signUpRedirectUrl,
      password: password,
    );
  }

  Future<void> sendResetPasswordLink({
    required String email,
  }) async {
    log.info('sendResetPasswordLink');
    log.fine('redirectTo: $_resetPasswordRedirectUrl');

    await _supabaseClient.auth.resetPasswordForEmail(
      email,
      redirectTo: _resetPasswordRedirectUrl,
    );
  }

  Future<void> resetPassword({
    required String password,
  }) async {
    log.info('resetPassword');

    await _supabaseClient.auth.updateUser(
      UserAttributes(
        password: password,
      ),
    );
  }

  Future<String> getAccessTokenFromUri({
    required Uri uri,
    required String? code,
    required String? refreshToken,
  }) async {
    log.info('getAccessTokenFromUri');
    if (refreshToken != null && refreshToken.isNotEmpty) {
      log.fine('refreshToken: $refreshToken');
      final response = await _supabaseClient.auth.setSession(refreshToken);
      return response.session!.accessToken;
    }

    if (code != null && code.isNotEmpty) {
      log.fine('code: $code');
      final response = await _supabaseClient.auth.exchangeCodeForSession(code);
      return response.session.accessToken;
    }

    log.fine('uri: $uri');
    final response = await _supabaseClient.auth.getSessionFromUrl(uri);
    return response.session.accessToken;
  }

  Future<void> resendEmailVerificationLink({
    required String email,
  }) async {
    log.info('resendEmailVerificationLink');
    log.fine('redirectTo: $_signUpRedirectUrl');

    final resendResponse = await _supabaseClient.auth.resend(
      email: email,
      type: OtpType.signup,
      emailRedirectTo: _signUpRedirectUrl,
    );

    log.info('message_id: ${resendResponse.messageId}');
  }
}
