import 'dart:io';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../outside/effect_providers/firebase_messaging/effect_provider.dart';
import '../../../outside/repositories/notifications/repository.dart';
import '../../../shared/mixins/logging.dart';

class Notifications_Cubit extends Cubit<void> with SharedMixin_Logging {
  Notifications_Cubit({
    required FirebaseMessaging_EffectProvider firebaseMessagingEffectProvider,
    required Notifications_Repository notificationsRepository,
  })  : _notificationsRepository = notificationsRepository,
        _firebaseMessagingEffectProvider = firebaseMessagingEffectProvider,
        super(null) {
    _firebaseMessagingEffectProvider
        .getEffect()
        .onTokenRefresh
        .listen((_) => updateToken());
  }

  final Notifications_Repository _notificationsRepository;
  final FirebaseMessaging_EffectProvider _firebaseMessagingEffectProvider;

  Future<void> updateToken() async {
    log.info('updateToken');

    final firebaseMessaging = _firebaseMessagingEffectProvider.getEffect();

    await firebaseMessaging.getAPNSToken();
    final token = await firebaseMessaging.getToken();
    log.info(token);
    final platform = Platform.isAndroid ? 'android' : 'ios';

    if (token != null) {
      try {
        await _notificationsRepository.updateToken(token, platform);
      } on Exception catch (e) {
        if (e.toString().contains('23503')) {
          log.warning('User does not exist in auth.users, signing out.');
          // Sign out the user using the Supabase client from the repository
          await _notificationsRepository.client.auth.signOut();
          // Optionally delete the Firebase token
          await firebaseMessaging.deleteToken();
        } else {
          log.severe('Error updating device token');
        }
      }
    }
  }

  Future<void> deleteDeviceToken() async {
    log.info('deleteDeviceToken');
    await _notificationsRepository.deleteDeviceToken();
  }

  Future<NotificationSettings> getNotificationSettings() async {
    log.info('getNotificationSettings');
    return _firebaseMessagingEffectProvider
        .getEffect()
        .getNotificationSettings();
  }
}
