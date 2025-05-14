import 'package:firebase_messaging/firebase_messaging.dart';

import '../base.dart';
import 'effect.dart';

class FirebaseMessaging_EffectProvider
    extends EffectProvider_Base<FirebaseMessaging_Effect> {
  const FirebaseMessaging_EffectProvider({
    required FirebaseMessaging firebaseMessaging,
  }) : _firebaseMessaging = firebaseMessaging;

  final FirebaseMessaging _firebaseMessaging;

  @override
  FirebaseMessaging_Effect getEffect() {
    return FirebaseMessaging_Effect(firebaseMessaging: _firebaseMessaging);
  }

  @override
  Future<void> init() async {}
}
