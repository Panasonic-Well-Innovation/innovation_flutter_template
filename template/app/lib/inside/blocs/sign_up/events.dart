import '../../../shared/models/enums/social_sign_in_provider.dart';

abstract class SignUp_Event {}

class SignUp_Event_SignUp extends SignUp_Event {
  SignUp_Event_SignUp({
    required this.email,
    required this.password,
  });

  final String email;
  final String password;
}

class SignUp_Event_ResendEmailVerificationLink extends SignUp_Event {
  SignUp_Event_ResendEmailVerificationLink({
    required this.email,
  });

  final String email;
}

class SignUp_Event_SocialSignUp extends SignUp_Event {
  SignUp_Event_SocialSignUp({
    required this.provider,
  });

  final ModelEnum_SocialSignInProvider provider;
}
