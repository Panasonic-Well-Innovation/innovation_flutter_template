import 'package:firebase_messaging/firebase_messaging.dart';

import '../../../shared/mixins/logging.dart';

class FirebaseMessaging_Effect with SharedMixin_Logging {
  FirebaseMessaging_Effect({
    required this.firebaseMessaging,
  });

  final FirebaseMessaging firebaseMessaging;

  Stream<String> get onTokenRefresh {
    log.info('onTokenRefresh');
    return firebaseMessaging.onTokenRefresh;
  }

  Future<String?> getAPNSToken() async {
    log.info('getAPNSToken');
    return firebaseMessaging.getAPNSToken();
  }

  Future<String?> getToken() async {
    log.info('getToken');
    return firebaseMessaging.getToken();
  }

  Future<void> deleteToken() async {
    log.info('deleteToken');
    return firebaseMessaging.deleteToken();
  }

  Future<NotificationSettings> getNotificationSettings() async {
    log.info('getNotificationSettings');
    return firebaseMessaging.getNotificationSettings();
  }
}
