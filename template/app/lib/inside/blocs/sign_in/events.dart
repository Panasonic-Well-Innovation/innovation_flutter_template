import '../../../shared/models/enums/social_sign_in_provider.dart';

abstract class SignIn_Event {}

class SignIn_Event_SignIn extends SignIn_Event {
  SignIn_Event_SignIn({
    required this.email,
    required this.password,
  });

  final String email;
  final String password;
}

class SignIn_Event_SocialSignIn extends SignIn_Event {
  SignIn_Event_SocialSignIn({
    required this.provider,
  });

  final ModelEnum_SocialSignInProvider provider;
}
