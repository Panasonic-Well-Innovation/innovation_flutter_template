import 'package:flutter/material.dart';

class FloatingActionBaseButton extends StatelessWidget {
  const FloatingActionBaseButton({
    required this.child,
    required this.onPressed,
    super.key,
  });

  final Widget child;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      style: ElevatedButton.styleFrom(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(40)),
        elevation: 0,
        backgroundColor: const Color(0x3D787880),
      ),
      onPressed: onPressed,
      child: child,
    );
  }
}
