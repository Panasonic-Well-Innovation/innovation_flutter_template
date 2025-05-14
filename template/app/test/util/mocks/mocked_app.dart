import 'package:flow_test/flow_test.dart';
import 'package:flutter/material.dart';
import 'package:gadfly_flutter_template/outside/effect_providers/all.dart';
import 'package:gadfly_flutter_template/outside/repositories/all.dart';
import 'package:gadfly_flutter_template/outside/theme/theme.dart';
import 'package:mocktail/mocktail.dart';

import '../app_builder.dart';
import 'effect_providers.dart';
import 'effects/all.dart';
import 'effects/auth_change_effect.dart';
import 'effects/mixpanel_effect.dart';
import 'repositories.dart';

List<MockedApp> createdMockedApps({
  required bool hasAccessToken,
  required String? deepLinkOverride,
}) =>
    [
      MockedApp(
        key: const Key('zincLight'),
        events: [],
        mocks: MocksContainer(),
        accessToken: hasAccessToken ? 'fakeAccessToken' : null,
        deepLinkOverride: deepLinkOverride,
        theme: OutsideThemes.lightTheme,
      ),
      MockedApp(
        key: const Key('zincDark'),
        events: [],
        mocks: MocksContainer(),
        accessToken: hasAccessToken ? 'fakeAccessToken' : null,
        deepLinkOverride: deepLinkOverride,
        theme: OutsideThemes.darkTheme,
      ),
    ];

class MockedApp extends FTMockedApp<MocksContainer> {
  MockedApp({
    required Key key,
    required super.events,
    required super.mocks,
    required String? accessToken,
    required String? deepLinkOverride,
    required OutsideTheme theme,
  }) : super(
          appBuilder: () async => await testAppBuilder(
            key: key,
            mocks: mocks,
            accessToken: accessToken,
            deepLinkOverride: deepLinkOverride,
            theme: theme,
          ),
        );
}

class MocksContainer {
  final repositories = Repositories_All(
    authRepository: MockAuthRepository(),
    notificationsRepository: MockNotificationsRepository(),
  );

  final effectProviders = EffectProviders_All(
    authChangeEffectProvider: MockAuthChangeEffectProvider(),
    mixpanelEffectProvider: MockMixpanelEffectProvider(),
    firebaseMessagingEffectProvider: MockFirebaseMessaging_EffectProvider(),
  );

  final effects = AllMockedEffects(
    authChangeEffect: MockAuthChangeEffect(),
    // Note: this is a special case where we are returning a Fake instead of a
    // Mock. Normally, we want to exclusively return Mocks.
    mixpanelEffect: Effect_Mixpanel_Fake(),
  );

  // As a convenience, we can mock all of the effect providers' getEffect method
  // to return our mocked effects. So be sure to mock the getEffect methos for
  // all new effect providers.
  void mockEffectProviderGetEffectMethods() {
    when(effectProviders.authChangeEffectProvider.getEffect)
        .thenReturn(effects.authChangeEffect);

    when(effectProviders.mixpanelEffectProvider.getEffect)
        .thenReturn(effects.mixpanelEffect);
  }
}
