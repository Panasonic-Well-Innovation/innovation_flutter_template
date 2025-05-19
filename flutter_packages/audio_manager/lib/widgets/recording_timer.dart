import 'dart:async';

import 'package:flutter/material.dart';

class RecordingTimer extends StatelessWidget {
  const RecordingTimer({required this.durationStream, super.key});

  final Stream<Duration> durationStream;

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<Duration>(
      stream: durationStream,
      builder: (context, snapshot) {
        if (snapshot.hasData) {
          return Text(formatDuration(snapshot.data!));
        }
        return const SizedBox.shrink();
      },
    );
  }

  String formatDuration(Duration duration) {
    final minutes = duration.inMinutes.remainder(60).toString().padLeft(2, '0');
    final secs = duration.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$minutes:$secs';
  }
}
