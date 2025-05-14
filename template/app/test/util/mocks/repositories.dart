import 'package:gadfly_flutter_template/outside/repositories/auth/repository.dart';
import 'package:gadfly_flutter_template/outside/repositories/notifications/repository.dart';
import 'package:mocktail/mocktail.dart';

class MockAuthRepository extends Mock implements Auth_Repository {}

class MockNotificationsRepository extends Mock
    implements Notifications_Repository {}
