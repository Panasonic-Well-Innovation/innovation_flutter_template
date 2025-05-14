import 'package:logging/logging.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../base.dart';

class Notifications_Repository extends Repository_Base {
  Notifications_Repository({
    required SupabaseClient supabaseClient,
  }) : _supabaseClient = supabaseClient;

  final SupabaseClient _supabaseClient;

  SupabaseClient get client => _supabaseClient;

  final _log = Logger('notifications_repository');

  @override
  Future<void> init() async {}

  Future<void> updateToken(String token, String platform) async {
    _log.info('updateToken');

    final userId = _supabaseClient.auth.currentUser!.id;

    //TODO: Update name of table and columns
    await _supabaseClient.from('device_tokens').upsert(
      {
        'user_id': userId,
        'device_token': token,
        'platform': platform,
      },
      onConflict: 'device_token',
    );
  }

  Future<void> deleteDeviceToken() async {
    final supabase = Supabase.instance.client;
    final user = supabase.auth.currentUser;

    if (user != null) {
      await supabase.from('device_tokens').delete().eq('user_id', user.id);
    }
  }
}
