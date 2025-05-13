import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../../outside/theme/theme.dart';
import '../../../../../shared/mixins/logging.dart';
import '../../../../blocs/sign_up/bloc.dart';
import '../../../../blocs/sign_up/events.dart';
import 'button_submit.dart';
import 'input_email.dart';
import 'input_password.dart';
import 'social_sign_up_column.dart';

class SignUp_Form_SignUp extends StatefulWidget with SharedMixin_Logging {
  const SignUp_Form_SignUp({super.key});

  @override
  State<SignUp_Form_SignUp> createState() => _SignUp_Form_SignUpState();
}

class _SignUp_Form_SignUpState extends State<SignUp_Form_SignUp> {
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

    context.read<SignUp_Bloc>().add(
          SignUp_Event_SignUp(
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
          SignUp_Input_Email(controller: emailController),
          SizedBox(height: context.tokens.spacing.medium),
          SignUp_Input_Password(controller: passwordController),
          SizedBox(height: context.tokens.spacing.medium),
          SignUp_Button_Submit(onSubmit: _onSubmit),
          const SignUp_Column_SocialSignIn(),
          SizedBox(height: context.tokens.spacing.medium),
        ],
      ),
    );
  }
}
