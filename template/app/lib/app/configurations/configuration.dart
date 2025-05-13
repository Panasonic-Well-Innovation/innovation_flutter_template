import 'package:logging/logging.dart' as logging;

import '../../inside/i18n/translations.g.dart';
import '../../outside/client_providers/sentry/client_provider_configuration.dart';
import '../../outside/client_providers/supabase/client_provider_configuration.dart';
import '../../outside/effect_providers/mixpanel/effect_provider_configuration.dart';
import '../../outside/theme/theme.dart';

class AppConfiguration {
  const AppConfiguration({
    required this.appLocale,
    required this.logLevel,
    required this.theme,
    required this.deepLinkBaseUri,
    required this.clientProvidersConfigurations,
    required this.effectProvidersConfigurations,
    required this.oauthConfiguration,
  });

  final AppLocale appLocale;
  final logging.Level logLevel;
  final OutsideTheme theme;
  final String deepLinkBaseUri;

  final ClientProvidersConfigurations clientProvidersConfigurations;
  final EffectProvidersConfigurations effectProvidersConfigurations;
  final OauthConfiguration oauthConfiguration;
}

class ClientProvidersConfigurations {
  ClientProvidersConfigurations({
    required this.sentry,
    required this.supabase,
  });

  final Sentry_ClientProvider_Configuration? sentry;
  final Supabase_ClientProvider_Configuration supabase;
}

class EffectProvidersConfigurations {
  EffectProvidersConfigurations({
    required this.mixpanel,
  });

  final Mixpanel_EffectProvider_Configuration mixpanel;
}

class OauthConfiguration {
  OauthConfiguration({
    required this.iosClientId,
    required this.webClientId,
    required this.androidClientId,
  });

  final String iosClientId;
  final String androidClientId;

  /// The web client ID for the app
  final String webClientId;
}
