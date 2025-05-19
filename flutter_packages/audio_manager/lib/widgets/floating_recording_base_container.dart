import 'package:flutter/material.dart';

class FloatingRecordingBaseContainer extends StatefulWidget {
  const FloatingRecordingBaseContainer({required this.child, super.key});

  final Widget child;

  @override
  State<FloatingRecordingBaseContainer> createState() =>
      _FloatingRecordingBaseContainerState();
}

class _FloatingRecordingBaseContainerState
    extends State<FloatingRecordingBaseContainer> {
  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Align(
        alignment: Alignment.bottomCenter,
        child: Container(
          margin: const EdgeInsets.all(16),
          padding: const EdgeInsets.all(16),
          width: double.infinity,
          height: 70,
          decoration: BoxDecoration(
            color: Colors.black,
            borderRadius: BorderRadius.circular(40),
          ),
          child: widget.child,
        ),
      ),
    );
  }
}
