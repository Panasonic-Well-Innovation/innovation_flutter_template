import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intersperse/intersperse.dart';

import '../../../../../outside/theme/theme.dart';
import '../../../../../shared/models/enums/social_sign_in_provider.dart';
import '../../../../blocs/sign_in/bloc.dart';
import '../../../../blocs/sign_in/events.dart';
import '../../../../blocs/sign_in/state.dart';
import '../../../../i18n/translations.g.dart';
import 'social_sign_in_button.dart';

class SignIn_Column_SocialSignIn extends StatelessWidget {
  const SignIn_Column_SocialSignIn({
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    final label = context.t.signIn.form.socialSignIn.title;
    final isLoading = context.select(
      (SignIn_Bloc bloc) => bloc.state.status == SignIn_Status.signInInProgress,
    );
    return Padding(
      padding: EdgeInsets.symmetric(vertical: context.tokens.spacing.medium),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'or',
            textAlign: TextAlign.center,
          ),
          SizedBox(height: context.tokens.spacing.medium),
          ...ModelEnum_SocialSignInProvider.values
              .map<Widget>(
                (provider) => SignIn_Button_SocialSignIn(
                  label: '$label ${provider.name}',
                  icon: _getIcon(provider),
                  isLoading: isLoading,
                  onPress: isLoading
                      ? null
                      : () {
                          context.read<SignIn_Bloc>().add(
                                SignIn_Event_SocialSignIn(provider: provider),
                              );
                        },
                ),
              )
              .intersperse(SizedBox(height: context.tokens.spacing.medium)),
        ],
      ),
    );
  }

  IconData _getIcon(ModelEnum_SocialSignInProvider provider) {
    switch (provider) {
      case ModelEnum_SocialSignInProvider.google:
        return Icons.g_mobiledata;
      case ModelEnum_SocialSignInProvider.facebook:
        return Icons.facebook;
      case ModelEnum_SocialSignInProvider.apple:
        return Icons.apple;
    }
  }
}
