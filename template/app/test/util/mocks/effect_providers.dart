import 'package:gadfly_flutter_template/outside/effect_providers/auth_change/effect_provider.dart';
import 'package:gadfly_flutter_template/outside/effect_providers/firebase_messaging/effect_provider.dart';
import 'package:gadfly_flutter_template/outside/effect_providers/mixpanel/effect_provider.dart';
import 'package:mocktail/mocktail.dart';

class MockAuthChangeEffectProvider extends Mock
    implements AuthChange_EffectProvider {}

class MockMixpanelEffectProvider extends Mock
    implements Mixpanel_EffectProvider {}

class MockFirebaseMessaging_EffectProvider extends Mock
    implements FirebaseMessaging_EffectProvider {}
