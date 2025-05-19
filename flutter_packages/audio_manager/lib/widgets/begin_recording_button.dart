import 'package:audio_waveforms/audio_waveforms.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_svg/svg.dart';

import '../../../../../blocs/record_audio/bloc.dart';
import '../../../../../blocs/record_audio/event.dart';
import '../../../../../effects/record_audio/effect.dart';

class BeginRecordingButton extends StatelessWidget {
  const BeginRecordingButton({
    required this.recordAudioEffect,
    required this.isStarting,
    required this.isSaving,
    required this.hasPendingRecording,
    super.key,
  });

  final RecordAudioEffect recordAudioEffect;
  final bool isStarting;
  final bool isSaving;
  final bool hasPendingRecording;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        StreamBuilder(
          stream: recordAudioEffect.onRecorderStateChangedStream(),
          builder: (context, snapshot) {
            final recordState = snapshot.data;
            final hasRecordings = true || hasPendingRecording;

            if (isStarting && recordState == null ||
                isStarting && recordState == RecorderState.stopped ||
                isSaving) {
              return ElevatedButton(
                style: ElevatedButton.styleFrom(
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  elevation: 0,
                  backgroundColor: CupertinoColors.activeBlue,
                ),
                onPressed: null,
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ],
                ),
              );
            }

            switch (recordState) {
              case null:
              case RecorderState.initialized:
              case RecorderState.stopped:
                return ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    elevation: 0,
                    backgroundColor:
                        hasRecordings
                            ? CupertinoColors.systemGrey3
                            : CupertinoColors.activeBlue,
                  ),
                  onPressed: () {
                    context.read<RecordAudioBloc>().add(
                      RecordAudioEvent_Record(),
                    );
                  },
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      SvgPicture.asset(
                        hasRecordings
                            ? 'assets/icons/mic_plus.svg'
                            : 'assets/icons/mic_white.svg',
                        height: 20,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        hasRecordings
                            ? 'Add Recording'
                            : 'Begin Recording the Visit',
                        style: TextStyle(
                          fontSize: 17,
                          color:
                              hasRecordings
                                  ? CupertinoColors.activeBlue
                                  : Colors.white,
                          fontWeight: FontWeight.w400,
                        ),
                      ),
                    ],
                  ),
                );

              case RecorderState.recording:
                return ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    elevation: 0,
                    backgroundColor: CupertinoColors.systemGrey,
                  ),
                  onPressed: () {
                    context.read<RecordAudioBloc>().add(
                      RecordAudioEvent_Stop(),
                    );
                  },
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.stop_rounded,
                        color: CupertinoColors.activeBlue,
                      ),
                      SizedBox(width: 8),
                      Text(
                        'Stop Recording',
                        style: TextStyle(
                          fontSize: 17,
                          color: CupertinoColors.activeBlue,
                          fontWeight: FontWeight.w400,
                        ),
                      ),
                    ],
                  ),
                );
              case RecorderState.paused:
                return ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    elevation: 0,
                    backgroundColor: CupertinoColors.activeBlue,
                  ),
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
                        height: 20,
                        colorFilter: const ColorFilter.mode(
                          Colors.white,
                          BlendMode.srcIn,
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        'Resume Recording',
                        style: TextStyle(
                          fontSize: 17,
                          color: Colors.white,
                          fontWeight: FontWeight.w400,
                        ),
                      ),
                    ],
                  ),
                );
            }
          },
        ),
      ],
    );
  }
}
