// ignore_for_file: lines_longer_than_80_chars

import 'package:audio_waveforms/audio_waveforms.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../../blocs/play_audio/bloc.dart';
import '../../../../../blocs/play_audio/event.dart';
import '../../../../../blocs/play_audio/state.dart';

import 'pause_stop_playing_button.dart';
import 'play_audio_listener.dart';
import 'resume_stop_playing_button.dart';
import 'start_playing_button.dart';

class RecordingPlayer extends StatelessWidget {
  const RecordingPlayer({required this.playerHeight, super.key});

  final double playerHeight;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.bottomCenter,
      child: Container(
        height: playerHeight,
        color: Colors.white,
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            MultiBlocProvider(
              providers: [
                BlocProvider(
                  create:
                      (context) =>
                          PlayAudioBloc()..add(
                            PlayAudioEvent_Init(
                              recordingPaths: ['test_recording.wav'],
                            ),
                          ),
                ),
              ],
              child: PlayAudioListener(
                builder: ({
                  required context,
                  required stream,
                  required isStarting,
                  required playerController,
                  required waveformData,
                }) {
                  return StreamBuilder<PlayerState>(
                    stream: stream,
                    builder: (context, snapshot) {
                      final playState = snapshot.data;
                      final playAudioBloc = context.watch<PlayAudioBloc>();

                      if (isStarting && playState == null ||
                          isStarting && playState == PlayerState.stopped ||
                          playAudioBloc.state.status ==
                              PlayAudioStatus.loading) {
                        return const Column(
                          children: [
                            SizedBox(
                              height: 10,
                              width: 10,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                            SizedBox(height: 8),
                            Text(
                              'Loading recordings...',
                              style: TextStyle(fontSize: 12),
                            ),
                          ],
                        );
                      }

                      return Row(
                        children: [
                          IconButton(
                            onPressed: () {
                              context.read<PlayAudioBloc>().add(
                                PlayAudioEvent_Reset(
                                  recordingPaths: ['test_recording.wav'],
                                ),
                              );
                            },
                            icon: const Center(
                              child: Icon(Icons.stop_rounded, size: 28),
                            ),
                          ),
                          Builder(
                            builder: (context) {
                              switch (playState) {
                                case null:
                                case PlayerState.initialized:
                                case PlayerState.stopped:
                                  return const StartPlayingButton();
                                case PlayerState.playing:
                                  return const PauseStopPlayingButton();
                                case PlayerState.paused:
                                  return const ResumeStopPlayingButton();
                              }
                            },
                          ),
                          Expanded(
                            child: AudioFileWaveforms(
                              playerController: playerController,
                              waveformData: playerController.waveformData,
                              continuousWaveform: true,
                              size: Size(
                                MediaQuery.of(context).size.width * 0.5,
                                50,
                              ),
                              playerWaveStyle: const PlayerWaveStyle(
                                fixedWaveColor: Colors.grey,
                                liveWaveColor: Colors.black,
                                showSeekLine: false,
                                spacing: 8,
                                waveThickness: 4,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          StreamBuilder<int>(
                            stream: playerController.onCurrentDurationChanged,
                            builder: (context, snapshot) {
                              return Text(
                                snapshot.hasData
                                    ? '${Duration(milliseconds: snapshot.data!).inMinutes.toString().padLeft(2, '0')}'
                                        ':${Duration(milliseconds: snapshot.data!).inSeconds.remainder(60).toString().padLeft(2, '0')}'
                                    : '00:00',
                                style: const TextStyle(
                                  fontSize: 15,
                                  color: CupertinoColors.systemGrey,
                                ),
                              );
                            },
                          ),
                        ],
                      );
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
