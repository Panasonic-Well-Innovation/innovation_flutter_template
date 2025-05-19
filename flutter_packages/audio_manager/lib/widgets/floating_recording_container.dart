import 'package:audio_waveforms/audio_waveforms.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_svg/svg.dart';

import '../../../../../blocs/record_audio/bloc.dart';
import '../../../../../blocs/record_audio/event.dart';
import '../../../../../effects/record_audio/effect.dart';

import 'floating_action_base_button.dart';
import 'floating_recording_base_container.dart';
import 'recording_timer.dart';

class FloatingRecordingContainer extends StatelessWidget {
  const FloatingRecordingContainer({
    required this.recordAudioEffect,
    super.key,
  });

  final RecordAudioEffect recordAudioEffect;

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<RecorderState>(
      stream: recordAudioEffect.onRecorderStateChangedStream(),
      builder: (context, snapshot) {
        final recordState = snapshot.data;

        switch (recordState) {
          case null:
          case RecorderState.initialized:
          case RecorderState.stopped:
            return const SizedBox.shrink();
          case RecorderState.recording:
            return FloatingRecordingBaseContainer(
              child: Row(
                children: [
                  const Icon(
                    Icons.fiber_manual_record,
                    color: Colors.red,
                    size: 12,
                  ),
                  const SizedBox(width: 16),
                  AudioWaveforms(
                    recorderController: recordAudioEffect.recorderController,
                    size: const Size(80, 10),
                    waveStyle: const WaveStyle(
                      waveColor: Colors.white,
                      extendWaveform: true,
                      showMiddleLine: false,
                      spacing: 8,
                      waveThickness: 3,
                    ),
                  ),
                  const SizedBox(width: 8),
                  RecordingTimer(
                    durationStream: recordAudioEffect.onDurationChangedStream(),
                  ),
                  const Spacer(),
                  Row(
                    children: [
                      IconButton(
                        onPressed: () {
                          context.read<RecordAudioBloc>().add(
                            RecordAudioEvent_Pause(),
                          );
                        },
                        icon: const Icon(
                          Icons.pause_rounded,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(width: 16),
                      IconButton(
                        onPressed: () {
                          context.read<RecordAudioBloc>().add(
                            RecordAudioEvent_Stop(),
                          );
                        },
                        icon: const Icon(
                          Icons.stop_rounded,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          case RecorderState.paused:
            return FloatingRecordingBaseContainer(
              child: Row(
                children: [
                  Expanded(
                    child: FloatingActionBaseButton(
                      onPressed: () {
                        context.read<RecordAudioBloc>().add(
                          RecordAudioEvent_Resume(),
                        );
                      },
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          SvgPicture.asset(
                            'assets/icons/mic_white.svg',
                            height: 16,
                            colorFilter: const ColorFilter.mode(
                              CupertinoColors.activeBlue,
                              BlendMode.srcIn,
                            ),
                          ),
                          const SizedBox(width: 4),
                          const Text(
                            'Resume',
                            style: TextStyle(
                              color: CupertinoColors.activeBlue,
                              fontSize: 15,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 32),
                  Expanded(
                    child: FloatingActionBaseButton(
                      onPressed: () {
                        context.read<RecordAudioBloc>().add(
                          RecordAudioEvent_Stop(),
                        );
                      },
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.stop_rounded, color: Colors.white),
                          SizedBox(width: 4),
                          Text(
                            'Stop',
                            style: TextStyle(color: Colors.white, fontSize: 15),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            );
        }
      },
    );
  }
}
