import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intersperse/intersperse.dart';

import '../../../../../outside/theme/theme.dart';
import '../../../../../shared/models/enums/social_sign_in_provider.dart';
import '../../../../blocs/sign_up/bloc.dart';
import '../../../../blocs/sign_up/events.dart';
import '../../../../blocs/sign_up/state.dart';
import '../../../../i18n/translations.g.dart';
import 'social_sign_up_button.dart';

class SignUp_Column_SocialSignIn extends StatelessWidget {
  const SignUp_Column_SocialSignIn({
    super.key,
  });

  @override
  Widget build(BuildContext context) {
    final label = context.t.signUp.form.socialSignUp.title;
    final isLoading = context.select(
      (SignUp_Bloc bloc) => bloc.state.status == SignUp_Status.signUpInProgress,
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
                (provider) => SignUp_Button_SocialSignIn(
                  label: '$label ${provider.name}',
                  icon: _getIcon(provider),
                  isLoading: isLoading,
                  onPress: isLoading
                      ? null
                      : () {
                          context.read<SignUp_Bloc>().add(
                                SignUp_Event_SocialSignUp(provider: provider),
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
