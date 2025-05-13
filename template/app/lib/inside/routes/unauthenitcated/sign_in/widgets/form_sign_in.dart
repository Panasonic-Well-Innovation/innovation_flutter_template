import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../../outside/theme/theme.dart';
import '../../../../../shared/mixins/logging.dart';
import '../../../../blocs/sign_in/bloc.dart';
import '../../../../blocs/sign_in/events.dart';
import 'button_submit.dart';
import 'input_email.dart';
import 'input_password.dart';
import 'link_forgot_password.dart';
import 'social_sign_in_column.dart';

class SignIn_Form_SignIn extends StatefulWidget with SharedMixin_Logging {
  const SignIn_Form_SignIn({super.key});

  @override
  State<SignIn_Form_SignIn> createState() => _SignIn_Form_SignInState();
}

class _SignIn_Form_SignInState extends State<SignIn_Form_SignIn> {
  final _formKey = GlobalKey<FormState>();
  bool _hasSubmittedBefore = false;

  late final TextEditingController emailController;
  late final TextEditingController passwordController;

  void _refresh() {
    setState(() {});
  }

  @override
  void initState() {
    super.initState();

    emailController = TextEditingController();
    passwordController = TextEditingController();

    emailController.addListener(_refresh);
    passwordController.addListener(_refresh);
  }

  @override
  void dispose() {
    emailController.dispose();
    passwordController.dispose();
    super.dispose();
  }

  void _onSubmit() {
    widget.log.info('submitting form');

    setState(() {
      _hasSubmittedBefore = true;
    });

    if (!_formKey.currentState!.validate()) {
      widget.log.warning('form not valid');
      // short-circuit if not valid
      return;
    }
    widget.log.info('form valid');

    context.read<SignIn_Bloc>().add(
          SignIn_Event_SignIn(
            email: emailController.text,
            password: passwordController.text,
          ),
        );
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      autovalidateMode: _hasSubmittedBefore
          ? AutovalidateMode.onUserInteraction
          : AutovalidateMode.disabled,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(height: context.tokens.spacing.medium),
          SignIn_Input_Email(controller: emailController),
          SizedBox(height: context.tokens.spacing.medium),
          SignIn_Input_Password(controller: passwordController),
          SizedBox(height: context.tokens.spacing.medium),
          const SignIn_Link_ForgotPassword(),
          SizedBox(height: context.tokens.spacing.medium),
          SignIn_Button_Submit(onSubmit: _onSubmit),
          const SignIn_Column_SocialSignIn(),
          SizedBox(height: context.tokens.spacing.medium),
        ],
      ),
    );
  }
}
