import 'base.dart';
import 'firebase_messaging/client_provider.dart';
import 'sentry/client_provider.dart';
import 'supabase/client_provider.dart';

/// When adding a new client provider, be sure to add it to:
/// - [getList]
class ClientProviders_All {
  ClientProviders_All({
    required this.sentryClientProvider,
    required this.supabaseClientProvider,
    required this.firebaseMessagingProvider,
  });

  final Sentry_ClientProvider sentryClientProvider;
  final Supabase_ClientProvider supabaseClientProvider;
  final FirebaseMessaging_ClientProvider firebaseMessagingProvider;

  List<ClientProvider_Base> getList() => [
        sentryClientProvider,
        supabaseClientProvider,
        firebaseMessagingProvider,
      ];

  Future<void> initialize() async {
    await Future.forEach(getList(), (r) async {
      r.log.fine('init');
      await r.init();
    });
  }
}
