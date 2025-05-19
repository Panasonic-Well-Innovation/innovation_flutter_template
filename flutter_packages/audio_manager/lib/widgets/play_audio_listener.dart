import 'package:audio_waveforms/audio_waveforms.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../../blocs/play_audio/bloc.dart';
import '../../../../../blocs/play_audio/event.dart';
import '../../../../../blocs/play_audio/state.dart';
import '../../../../../effects/play_audio/effect.dart';
import '../../../../../effects/play_audio/provider.dart';

class PlayAudioListener extends StatefulWidget {
  const PlayAudioListener({required this.builder, super.key});

  final Widget Function({
    required BuildContext context,
    required Stream<PlayerState> stream,
    required bool isStarting,
    required PlayerController playerController,
    required List<double>? waveformData,
  })
  builder;

  @override
  State<PlayAudioListener> createState() => _PlayAudioListenerState();
}

class _PlayAudioListenerState extends State<PlayAudioListener> {
  late PlayAudioEffect _playAudioEffect;
  final List<String> recordingPaths = [];
  int currentRecordingIndex = 0;

  bool _isStarting = false;

  @override
  void initState() {
    super.initState();
    _playAudioEffect = context.read<PlayAudioEffectProvider>().getEffect();

    // Listen to the completion stream
    // and play the next audio file in the list
    // when the current one finishes
    _playAudioEffect.onCompletionStream().listen((event) async {
      if (currentRecordingIndex < recordingPaths.length - 1) {
        currentRecordingIndex++;

        await _playAudioEffect.prepareFileWithPath(
          recordingPaths[currentRecordingIndex],
        );
        await _playAudioEffect.start();
        setState(() {
          _isStarting = true;
        });
      } else {
        setState(() {
          _isStarting = false;
        });
      }
    });
  }

  @override
  void dispose() {
    _playAudioEffect.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<PlayAudioBloc, PlayAudioState>(
      listener: (context, state) async {
        final playAudioBloc = context.read<PlayAudioBloc>();
        final sm = ScaffoldMessenger.of(context);

        switch (state.status) {
          case PlayAudioStatus.idle:
          case PlayAudioStatus.loading:
            break;
          case PlayAudioStatus.loaded:
            recordingPaths.addAll(state.localPaths!);
            await _playAudioEffect.prepareFileWithPath(recordingPaths.first);
            setState(() {
              currentRecordingIndex = 0; // Reset index to 0
            });

          case PlayAudioStatus.error:
            setState(() {
              _isStarting = false;
            });
            sm.hideCurrentSnackBar();
            sm.showSnackBar(
              SnackBar(
                backgroundColor: Colors.red,
                content: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Error player audio',
                      style: TextStyle(color: Colors.white),
                    ),
                  ],
                ),
              ),
            );
          case PlayAudioStatus.play:
            try {
              setState(() {
                _isStarting = true;
              });
              await _playAudioEffect.start();
            } catch (e) {
              playAudioBloc.add(PlayAudioEvent_Error());
            }
          case PlayAudioStatus.pause:
            try {
              await _playAudioEffect.pause();
            } catch (e) {
              playAudioBloc.add(PlayAudioEvent_Error());
            }
          case PlayAudioStatus.resume:
            try {
              await _playAudioEffect.resume();
            } catch (e) {
              playAudioBloc.add(PlayAudioEvent_Error());
            }

          case PlayAudioStatus.stop:
            try {
              setState(() {
                _isStarting = false;
              });
              await _playAudioEffect.stop();
            } catch (e) {
              playAudioBloc.add(PlayAudioEvent_Error());
            }
        }
      },
      child: widget.builder(
        context: context,
        stream: _playAudioEffect.onStateChangedStream(),
        isStarting: _isStarting,
        playerController: _playAudioEffect.playerController,
        waveformData: _playAudioEffect.waveformData,
      ),
    );
  }
}
