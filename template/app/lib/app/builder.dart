import 'package:auto_route/auto_route.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
// This package should come with flutter, so we aren't depending on it
// explicitly
// ignore: depend_on_referenced_packages
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:forui/forui.dart';
import 'package:logging/logging.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

import '../inside/blocs/auth/bloc.dart';
import '../inside/blocs/auth/state.dart';
import '../inside/cubits/notifications/cubit.dart';
import '../inside/i18n/translations.g.dart';
import '../inside/routes/deep_link_handler.dart';
import '../inside/routes/router.dart';
import '../outside/effect_providers/all.dart';
import '../outside/effect_providers/mixpanel/route_observer.dart';
import '../outside/repositories/all.dart';
import '../outside/theme/theme.dart';

final _log = Logger('app_builder');

/// This function builds the root widget of our application. We consider this
/// function to be the "front-door" to the inside of our application's widget
/// tree. This function is also used as the starting point for our Flow Tests.
Future<Widget> appBuilder({
  required Key key,
  required AppLocale appLocale,
  required OutsideTheme theme,
  required String? accessToken,
  required String? deepLinkFragmentOverride,
  required EffectProviders_All effectProviders,
  required Repositories_All repositories,
}) async {
  // Set locale
  await LocaleSettings.setLocale(appLocale);
  _log.info('locale: ${appLocale.languageCode}');

  // Set access token if there is one
  _log.fine('access token:\n$accessToken');
  final authState = accessToken != null && accessToken.isNotEmpty
      ? Auth_State(
          status: Auth_Status.authenticated,
          accessToken: accessToken,
        )
      : const Auth_State(
          status: Auth_Status.unauthentcated,
          accessToken: null,
        );

  // Special case: create AuthBloc outside of widget tree, because it is
  // required by AppRouter, which needs to be created above the widget tree.
  final authBloc = Auth_Bloc(
    authRepository: repositories.authRepository,
    initialState: authState,
  );

  final appNavigatorKey = GlobalKey<NavigatorState>();

  final router = Routes_router(
    authBloc: authBloc,
    navigatorKey: appNavigatorKey,
  );

  final deepLinkHandler = Routes_DeepLinkHandler(
    appNavigatorKey: appNavigatorKey,
    authBloc: authBloc,
    foruiThemeData: theme.foruiThemeData,
  );

  final notificationsCubit = Notifications_Cubit(
    firebaseMessagingEffectProvider:
        effectProviders.firebaseMessagingEffectProvider,
    notificationsRepository: repositories.notificationsRepository,
  );

  return TranslationProvider(
    child: App(
      key: key,
      deepLinkFragmentOverride: deepLinkFragmentOverride,
      deepLinkHandler: deepLinkHandler,
      theme: theme,
      authBloc: authBloc,
      notificationsCubit: notificationsCubit,
      router: router,
      effectProviders: effectProviders,
      repositories: repositories,
    ),
  );
}

class App extends StatelessWidget {
  const App({
    required this.deepLinkFragmentOverride,
    required this.deepLinkHandler,
    required this.theme,
    required this.authBloc,
    required this.notificationsCubit,
    required this.router,
    required this.effectProviders,
    required this.repositories,
    super.key,
  });

  final String? deepLinkFragmentOverride;
  final Routes_DeepLinkHandler deepLinkHandler;
  final OutsideTheme theme;
  final Auth_Bloc authBloc;
  final Notifications_Cubit notificationsCubit;
  final EffectProviders_All effectProviders;
  final Repositories_All repositories;

  final Routes_router router;

  @override
  Widget build(BuildContext context) {
    return MultiRepositoryProvider(
      providers: [
        ...effectProviders.createProviders(),
        ...repositories.createProviders(),
      ],
      child: MultiBlocProvider(
        providers: [
          BlocProvider.value(value: authBloc),
          BlocProvider.value(value: notificationsCubit),
        ],
        child: MaterialApp.router(
          theme: theme.materialThemeData,
          builder: (context, child) {
            return FTheme(
              data: theme.foruiThemeData,
              child: child ?? const FScaffold(content: SizedBox()),
            );
          },
          debugShowCheckedModeBanner: false,
          scrollBehavior: const MaterialScrollBehavior().copyWith(
            dragDevices: {
              PointerDeviceKind.touch,
              PointerDeviceKind.mouse,
            },
          ),
          localizationsDelegates: const [
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
            FLocalizations.delegate,
          ],
          locale: TranslationProvider.of(context).flutterLocale,
          supportedLocales: AppLocaleUtils.supportedLocales,
          routeInformationParser: router.defaultRouteParser(
            includePrefixMatches: true,
          ),
          routerDelegate: AutoRouterDelegate(
            router,
            rebuildStackOnDeepLink: true,
            deepLinkBuilder: (deepLink) => deepLinkHandler.handleDeepLink(
              deepLink: deepLink,
              deepLinkFragmentOverride: deepLinkFragmentOverride,
            ),
            navigatorObservers: () => [
              AutoRouteObserver(),
              Mixpanel_Effect_RouteObserver(
                mixpanelEffect:
                    effectProviders.mixpanelEffectProvider.getEffect(),
              ),
              SentryNavigatorObserver(),
            ],
          ),
        ),
      ),
    );
  }
}
