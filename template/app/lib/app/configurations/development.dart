import 'package:flutter/foundation.dart';
import 'package:logging/logging.dart' as logging;

import '../../inside/i18n/translations.g.dart';
import '../../outside/client_providers/supabase/client_provider_configuration.dart';
import '../../outside/effect_providers/mixpanel/effect_provider_configuration.dart';
import '../../outside/theme/theme.dart';
import '../runner.dart';
import 'configuration.dart';

void main() {
  const siteHost = String.fromEnvironment('SITE_HOST');
  const googleWebClientId = String.fromEnvironment('GOOGLE_WEB_CLIENT_ID');
  const iosClientId = String.fromEnvironment('GOOGLE_IOS_CLIENT_ID');
  const androidClientId = String.fromEnvironment('GOOGLE_ANDROID_CLIENT_ID');
  const appleServiceId = String.fromEnvironment('APPLE_SERVICE_ID');

  final configuration = AppConfiguration(
    appLocale: AppLocale.en,
    logLevel: logging.Level.ALL,
    theme: OutsideThemes.lightTheme,
    deepLinkBaseUri:
        kIsWeb
            ? 'http://$siteHost:3000'
            : 'com.gadfly361.gadflyfluttertemplate.deep://deeplink-callback',
    oauthConfiguration: OauthConfiguration(
      iosClientId: iosClientId,
      webClientId: googleWebClientId,
      androidClientId: androidClientId,
      appleServiceId: appleServiceId,
    ),
    clientProvidersConfigurations: ClientProvidersConfigurations(
      sentry: null,
      supabase: const Supabase_ClientProvider_Configuration(
        url: 'http://$siteHost:54321',
        anonKey:
            '''eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtib3h3anJqdHFrc3BudnR1dWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAyMjQyNTMsImV4cCI6MjA0NTgwMDI1M30.7Cb71Zo9OQeoiWoVH6_oom-IoZUbdOEUkT5TMV4md0s''',
      ),
    ),
    effectProvidersConfigurations: EffectProvidersConfigurations(
      mixpanel: const Mixpanel_EffectProvider_Configuration(
        sendEvents: false,
        token: null,
        environment: null,
      ),
    ),
  );

  appRunner(configuration: configuration);
}
