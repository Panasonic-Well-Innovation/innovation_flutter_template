import 'dart:developer';

import 'package:audio_waveforms/audio_waveforms.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../../blocs/record_audio/bloc.dart';
import '../../../../../blocs/record_audio/event.dart';
import '../../../../../blocs/record_audio/state.dart';
import '../../../../../effects/record_audio/effect.dart';

class RecordAudioListener extends StatefulWidget {
  const RecordAudioListener({
    required this.eventId,
    required this.builder,
    required this.recordAudioEffect,
    super.key,
  });

  final String eventId;
  final RecordAudioEffect recordAudioEffect;

  final Widget Function({
    required BuildContext context,
    required Stream<RecorderState> stream,
    required bool isStarting,
    required bool isSaving,
    required bool isSaved,
    required RecorderController recorderController,
    required Stream<Duration> durationStream,
  })
  builder;

  @override
  State<RecordAudioListener> createState() => _RecordAudioListenerState();
}

class _RecordAudioListenerState extends State<RecordAudioListener> {
  bool _isStarting = false;
  bool _isSaving = false;
  bool _isSaved = false;

  @override
  Widget build(BuildContext context) {
    return BlocListener<RecordAudioBloc, RecordAudioState>(
      listener: (context, state) async {
        final recordAudioBloc = context.read<RecordAudioBloc>();
        final sm = ScaffoldMessenger.of(context);

        log('RecordAudioBloc state: $state');

        switch (state.status) {
          case RecordAudioStatus.idle:
            break;
          case RecordAudioStatus.error:
          case RecordAudioStatus.errorSaving:
            setState(() {
              _isStarting = false;
              _isSaving = false;
            });

            sm.hideCurrentSnackBar();
            sm.showSnackBar(
              SnackBar(
                content: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(state.error ?? 'Error', style: const TextStyle()),
                  ],
                ),
              ),
            );

          case RecordAudioStatus.record:
            try {
              setState(() {
                _isStarting = true;
                _isSaving = false;
              });

              await widget.recordAudioEffect.start(eventId: widget.eventId);
            } catch (e) {
              recordAudioBloc.add(
                RecordAudioEvent_Error(
                  errorMessage: 'Error starting recording',
                ),
              );
            }
          case RecordAudioStatus.pause:
            try {
              await widget.recordAudioEffect.pause();
            } catch (e) {
              recordAudioBloc.add(
                RecordAudioEvent_Error(errorMessage: 'Error pausing recording'),
              );
            }
          case RecordAudioStatus.resume:
            try {
              await widget.recordAudioEffect.resume();
            } catch (e) {
              recordAudioBloc.add(
                RecordAudioEvent_Error(
                  errorMessage: 'Error resuming recording',
                ),
              );
            }

          case RecordAudioStatus.stop:
            try {
              setState(() {
                _isStarting = false;
                _isSaving = false;
              });
              final recordingPath = await widget.recordAudioEffect.stop();

              // If there is a recording, then save it
              final recordingBytes = await widget.recordAudioEffect
                  .getFileBytes(recordingPath: recordingPath!);

              if (context.mounted) {
                recordAudioBloc.add(
                  RecordAudioEvent_Save(
                    recordingBytes: recordingBytes,
                    recordingPath: recordingPath,
                    eventId: widget.eventId,
                  ),
                );
              }
            } catch (e) {
              recordAudioBloc.add(
                RecordAudioEvent_Error(
                  errorMessage: 'Error stopping the recording',
                ),
              );
            }
          case RecordAudioStatus.saving:
            setState(() {
              _isStarting = false;
              _isSaving = true;
            });
          case RecordAudioStatus.saved:
            setState(() {
              _isStarting = false;
              _isSaving = false;
              _isSaved = true;
            });
        }
      },
      child: widget.builder(
        context: context,
        stream: widget.recordAudioEffect.onRecorderStateChangedStream(),
        isStarting: _isStarting,
        isSaving: _isSaving,
        isSaved: _isSaved,
        recorderController: widget.recordAudioEffect.recorderController,
        durationStream: widget.recordAudioEffect.onDurationChangedStream(),
      ),
    );
  }
}
