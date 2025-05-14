import 'package:firebase_messaging/firebase_messaging.dart';

import '../base.dart';

class FirebaseMessaging_ClientProvider extends ClientProvider_Base {
  FirebaseMessaging_ClientProvider();

  FirebaseMessaging get client => FirebaseMessaging.instance;

  @override
  Future<void> init() async {}
}
