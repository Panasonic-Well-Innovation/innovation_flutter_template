import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../../blocs/play_audio/bloc.dart';
import '../../../../../blocs/play_audio/event.dart';

class StartPlayingButton extends StatelessWidget {
  const StartPlayingButton({super.key});

  @override
  Widget build(BuildContext context) {
    return IconButton(
      onPressed: () {
        context.read<PlayAudioBloc>().add(PlayAudioEvent_Play());
      },
      icon: const Center(child: Icon(Icons.play_arrow_rounded, size: 30)),
    );
  }
}
