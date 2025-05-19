import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../../blocs/play_audio/bloc.dart';
import '../../../../../blocs/play_audio/event.dart';

class ResumeStopPlayingButton extends StatelessWidget {
  const ResumeStopPlayingButton({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        IconButton(
          onPressed: () {
            context.read<PlayAudioBloc>().add(PlayAudioEvent_Resume());
          },
          icon: const Center(child: Icon(Icons.play_arrow_rounded, size: 30)),
        ),
      ],
    );
  }
}
