import 'package:flutter/foundation.dart';
import 'package:logging/logging.dart' as logging;

import '../../inside/i18n/translations.g.dart';
import '../../outside/client_providers/sentry/client_provider_configuration.dart';
import '../../outside/client_providers/supabase/client_provider_configuration.dart';
import '../../outside/effect_providers/mixpanel/effect_provider_configuration.dart';
import '../../outside/theme/theme.dart';
import '../runner.dart';
import 'configuration.dart';

// TODO: update CHANGE_ME lines

void main() {
  final configuration = AppConfiguration(
    appLocale: AppLocale.en,
    logLevel: logging.Level.INFO,
    theme: OutsideThemes.lightTheme,
    deepLinkBaseUri:
        kIsWeb
            ? 'CHANGE_ME'
            : 'com.gadfly361.gadflyfluttertemplate.deep://deeplink-callback',
    oauthConfiguration: OauthConfiguration(
      iosClientId: 'CHANGE_ME',
      webClientId: 'CHANGE_ME',
      androidClientId: 'CHANGE_ME',
      appleServiceId: 'CHANGE_ME',
    ),
    clientProvidersConfigurations: ClientProvidersConfigurations(
      sentry: const Sentry_ClientProvider_Configuration(
        dsn: 'CHANGE_ME',
        environment: 'production',
        tracesSampleRate: 0,
      ),
      supabase: const Supabase_ClientProvider_Configuration(
        url: 'CHANGE_ME',
        anonKey: '''CHANGE_ME''',
      ),
    ),
    effectProvidersConfigurations: EffectProvidersConfigurations(
      mixpanel: const Mixpanel_EffectProvider_Configuration(
        sendEvents: true,
        token: 'CHANGE_ME',
        environment: 'CHANGE_ME',
      ),
    ),
  );

  appRunner(configuration: configuration);
}
