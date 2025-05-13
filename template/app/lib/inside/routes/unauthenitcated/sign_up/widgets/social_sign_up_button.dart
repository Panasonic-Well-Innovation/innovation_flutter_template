import 'package:flutter/material.dart';
import 'package:forui/forui.dart';

class SignUp_Button_SocialSignIn extends StatelessWidget {
  const SignUp_Button_SocialSignIn({
    required this.label,
    required this.onPress,
    required this.isLoading,
    required this.icon,
    super.key,
  });

  final String label;
  final VoidCallback? onPress;
  final bool isLoading;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return FButton.icon(
      onPress: isLoading ? null : onPress,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(label),
          Padding(
            padding: const EdgeInsets.only(left: 8),
            child: Icon(icon),
          ),
        ],
      ),
    );
  }
}
