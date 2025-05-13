// coverage:ignore-file

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:logging/logging.dart';
import 'package:sentry_flutter/sentry_flutter.dart';
import 'package:uuid/uuid.dart';

import '../inside/blocs/observer.dart';
import '../outside/client_providers/all.dart';
import '../outside/client_providers/sentry/client_provider.dart';
import '../outside/client_providers/supabase/client_provider.dart';
import '../outside/effect_providers/all.dart';
import '../outside/effect_providers/auth_change/effect_provider.dart';
import '../outside/effect_providers/mixpanel/effect_provider.dart';
import '../outside/repositories/all.dart';
import '../outside/repositories/auth/repository.dart';
import 'builder.dart';
import 'configurations/configuration.dart';

/// This function runs our application. This is where we do any kind of setup
/// that needs to happen before [appBuilder] is called and our widget tree is
/// created. This is where certain dependencies, such as repositories and effect
/// providers, can be initialized outside of the widget tree.
Future<void> appRunner({
  required AppConfiguration configuration,
}) async {
  // Set up logging
  _setUpLogging(logLevel: configuration.logLevel);

  final log = Logger('app_runner');

  WidgetsFlutterBinding.ensureInitialized();

  // If flutter error, log severe
  FlutterError.onError = (details) {
    log.severe(details.exceptionAsString(), details.exception, details.stack);
  };

  // Create initial sessionId
  final initialSessionId = const Uuid().v4();

  // Create and initialize client providers
  final clientProviders = ClientProviders_All(
    sentryClientProvider: Sentry_ClientProvider(
      initialSessionId: initialSessionId,
      configuration: configuration.clientProvidersConfigurations.sentry,
    ),
    supabaseClientProvider: Supabase_ClientProvider(
      configuration: configuration.clientProvidersConfigurations.supabase,
    ),
  );
  await clientProviders.initialize();

  // Create and initialize effect providers
  final effectProviders = EffectProviders_All(
    authChangeEffectProvider: AuthChange_EffectProvider(
      supabaseClient: clientProviders.supabaseClientProvider.client,
    ),
    mixpanelEffectProvider: Mixpanel_EffectProvider(
      initialSessionId: initialSessionId,
      configuration: configuration.effectProvidersConfigurations.mixpanel,
    ),
  );
  await effectProviders.initialize();

  // Create and initialize repositories
  final repositories = Repositories_All(
    authRepository: Auth_Repository(
      deepLinkBaseUri: configuration.deepLinkBaseUri,
      oauthConfiguration: configuration.oauthConfiguration,
      mixpanelEffectProvider: effectProviders.mixpanelEffectProvider,
      sentryClientProvider: clientProviders.sentryClientProvider,
      supabaseClient: clientProviders.supabaseClientProvider.client,
    ),
  );
  await repositories.initialize();

  // Setup Bloc Observer
  // Reminder that this should be after logging is set up
  Bloc.observer = Blocs_Observer();

  // Get access token if there is one
  final accessToken = clientProviders
      .supabaseClientProvider.client.auth.currentSession?.accessToken;

  // If an access token exists, then update the users in clients
  if (accessToken != null && accessToken.isNotEmpty) {
    try {
      await repositories.authRepository.updatesUsersInClients();
    } catch (e) {
      log.warning(e);
    }
  }

  final app = SentryWidget(
    child: DefaultAssetBundle(
      bundle: SentryAssetBundle(),
      child: await appBuilder(
        key: const Key('app'),
        deepLinkFragmentOverride: null,
        appLocale: configuration.appLocale,
        theme: configuration.theme,
        accessToken: accessToken,
        effectProviders: effectProviders,
        repositories: repositories,
      ),
    ),
  );
  runApp(app);
}

void _setUpLogging({required Level logLevel}) {
  Logger.root.level = logLevel;
  Logger.root.clearListeners();
  Logger.root.onRecord.listen((record) {
    final message =
        '''[${record.loggerName}] ${record.level}: ${record.message}''';

    if (record.stackTrace != null) {
      debugPrint('''$message\n${record.error}''');
    } else {
      debugPrint(message);
    }
  });
}
