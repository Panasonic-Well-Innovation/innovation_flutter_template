import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:bloc_concurrency/bloc_concurrency.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:path_provider/path_provider.dart';

import 'event.dart';
import 'state.dart';

class PlayAudioBloc extends Bloc<PlayAudioEvent, PlayAudioState> {
  PlayAudioBloc() : super(const PlayAudioState(status: PlayAudioStatus.idle)) {
    on<PlayAudioEvent_Init>(_onInit, transformer: sequential());
    on<PlayAudioEvent_Error>(_onError, transformer: sequential());
    on<PlayAudioEvent_Play>(_onPlay, transformer: sequential());
    on<PlayAudioEvent_Pause>(_onPause, transformer: sequential());
    on<PlayAudioEvent_Resume>(_onResume, transformer: sequential());
    on<PlayAudioEvent_Stop>(_onStop, transformer: sequential());
    on<PlayAudioEvent_Reset>(_onReset, transformer: sequential());
  }

  FutureOr<void> _onInit(
    PlayAudioEvent_Init event,
    Emitter<PlayAudioState> emit,
  ) async {
    try {
      emit(const PlayAudioState(status: PlayAudioStatus.loading));

      final recordingByteList = <Uint8List?>[];

      for (final path in event.recordingPaths) {
        final byteData = await rootBundle.load('assets/recordings/$path');
        final recordingBytes = byteData.buffer.asUint8List();
        recordingByteList.add(recordingBytes);
      }

      // for (final path in event.recordingPaths) {
      //   final recordingBytes = await _eventRepository.getRecordingBytes(
      //     recordingPath: path,
      //   );
      //   recordingByteList.add(recordingBytes);
      // }

      final tempDir = await getTemporaryDirectory();
      final localPaths = <String>[];

      for (final bytes in recordingByteList) {
        final path =
            '${tempDir.path}/temp_audio_${DateTime.now().toIso8601String()}.wav';
        final tempFile = File(path);
        await tempFile.writeAsBytes(bytes!);
        localPaths.add(path);
      }

      emit(
        PlayAudioState(status: PlayAudioStatus.loaded, localPaths: localPaths),
      );
    } catch (e) {
      emit(state.copyWith(status: PlayAudioStatus.error));
    } finally {
      emit(state.copyWith(status: PlayAudioStatus.idle));
    }
  }

  Future<void> _onError(
    PlayAudioEvent_Error event,
    Emitter<PlayAudioState> emit,
  ) async {
    emit(state.copyWith(status: PlayAudioStatus.error));
    emit(state.copyWith(status: PlayAudioStatus.idle));
  }

  Future<void> _onPlay(
    PlayAudioEvent_Play event,
    Emitter<PlayAudioState> emit,
  ) async {
    emit(state.copyWith(status: PlayAudioStatus.play));
    emit(state.copyWith(status: PlayAudioStatus.idle));
  }

  Future<void> _onPause(
    PlayAudioEvent_Pause event,
    Emitter<PlayAudioState> emit,
  ) async {
    emit(state.copyWith(status: PlayAudioStatus.pause));
    emit(state.copyWith(status: PlayAudioStatus.idle));
  }

  Future<void> _onResume(
    PlayAudioEvent_Resume event,
    Emitter<PlayAudioState> emit,
  ) async {
    emit(state.copyWith(status: PlayAudioStatus.resume));
    emit(state.copyWith(status: PlayAudioStatus.idle));
  }

  Future<void> _onStop(
    PlayAudioEvent_Stop event,
    Emitter<PlayAudioState> emit,
  ) async {
    emit(state.copyWith(status: PlayAudioStatus.stop));
    emit(state.copyWith(status: PlayAudioStatus.idle));
  }

  FutureOr<void> _onReset(
    PlayAudioEvent_Reset event,
    Emitter<PlayAudioState> emit,
  ) async {
    emit(state.copyWith(status: PlayAudioStatus.stop));
    emit(state.copyWith(status: PlayAudioStatus.idle));

    add(PlayAudioEvent_Init(recordingPaths: event.recordingPaths));
  }
}
