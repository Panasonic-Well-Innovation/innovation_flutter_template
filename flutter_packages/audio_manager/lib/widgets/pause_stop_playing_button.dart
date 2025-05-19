import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../../blocs/play_audio/bloc.dart';
import '../../../../../blocs/play_audio/event.dart';

class PauseStopPlayingButton extends StatelessWidget {
  const PauseStopPlayingButton({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        IconButton(
          onPressed: () {
            context.read<PlayAudioBloc>().add(PlayAudioEvent_Pause());
          },
          icon: const Center(child: Icon(Icons.pause_outlined, size: 30)),
        ),
      ],
    );
  }
}
