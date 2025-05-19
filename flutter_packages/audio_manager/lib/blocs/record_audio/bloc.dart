import 'dart:async';

import 'package:bloc_concurrency/bloc_concurrency.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'package:wakelock_plus/wakelock_plus.dart';

import 'event.dart';
import 'state.dart';

class RecordAudioBloc extends Bloc<RecordAudioEvent, RecordAudioState> {
  RecordAudioBloc()
    : super(const RecordAudioState(status: RecordAudioStatus.idle)) {
    on<RecordAudioEvent_Error>(_onError, transformer: sequential());
    on<RecordAudioEvent_Record>(_onRecord, transformer: sequential());
    on<RecordAudioEvent_Pause>(_onPause, transformer: sequential());
    on<RecordAudioEvent_Resume>(_onResume, transformer: sequential());
    on<RecordAudioEvent_Stop>(_onStop, transformer: sequential());
    on<RecordAudioEvent_Save>(_onSave, transformer: concurrent());
    on<RecordAudioEvent_SaveBulk>(_onBulkSave, transformer: concurrent());
    on<RecordAudioEvent_ParseAndSave>(
      _onParseAndSave,
      transformer: concurrent(),
    );
  }

  Future<void> _onError(
    RecordAudioEvent_Error event,
    Emitter<RecordAudioState> emit,
  ) async {
    await WakelockPlus.disable();
    emit(
      RecordAudioState(
        status: RecordAudioStatus.error,
        error: event.errorMessage,
      ),
    );
    emit(const RecordAudioState(status: RecordAudioStatus.idle));
  }

  Future<void> _onRecord(
    RecordAudioEvent_Record event,
    Emitter<RecordAudioState> emit,
  ) async {
    await WakelockPlus.enable();
    emit(const RecordAudioState(status: RecordAudioStatus.record));
    emit(const RecordAudioState(status: RecordAudioStatus.idle));
  }

  Future<void> _onPause(
    RecordAudioEvent_Pause event,
    Emitter<RecordAudioState> emit,
  ) async {
    emit(const RecordAudioState(status: RecordAudioStatus.pause));
    emit(const RecordAudioState(status: RecordAudioStatus.idle));
  }

  Future<void> _onResume(
    RecordAudioEvent_Resume event,
    Emitter<RecordAudioState> emit,
  ) async {
    emit(const RecordAudioState(status: RecordAudioStatus.resume));
    emit(const RecordAudioState(status: RecordAudioStatus.idle));
  }

  Future<void> _onStop(
    RecordAudioEvent_Stop event,
    Emitter<RecordAudioState> emit,
  ) async {
    await WakelockPlus.disable();
    emit(const RecordAudioState(status: RecordAudioStatus.stop));
    emit(const RecordAudioState(status: RecordAudioStatus.idle));
  }

  Future<void> _onSave(
    RecordAudioEvent_Save event,
    Emitter<RecordAudioState> emit,
  ) async {
    emit(const RecordAudioState(status: RecordAudioStatus.saving));

    try {
      final lengthInBytes = event.recordingBytes.lengthInBytes;
      if (lengthInBytes <= 4096) {
        throw Exception('empty recording');
      }

      final result = true;

      // final result = await _eventsRepository.saveRecording(
      //   eventId: event.eventId,
      //   path: event.recordingPath,
      //   recordingId: event.recordingId,
      //   previousSavedPath: event.previousSavedPath,
      // );

      emit(
        state.copyWith(
          status:
              result ? RecordAudioStatus.saved : RecordAudioStatus.errorSaving,
          error: result ? '' : 'Error saving the recording',
        ),
      );
    } catch (e) {
      emit(
        const RecordAudioState(
          status: RecordAudioStatus.errorSaving,
          error: 'Error saving the recording',
        ),
      );
    } finally {
      emit(const RecordAudioState(status: RecordAudioStatus.idle));
    }
  }

  Future<void> _onBulkSave(
    RecordAudioEvent_SaveBulk event,
    Emitter<RecordAudioState> emit,
  ) async {
    emit(const RecordAudioState(status: RecordAudioStatus.saving));

    var result = true;

    try {
      for (final recording in event.recordings) {
        // Save each recording

        // result = await _eventsRepository.saveRecording(
        //   eventId: event.eventId,
        //   path: recording.localPath,
        //   recordingId: recording.recordingId,
        //   previousSavedPath: recording.storagePath,
        // );
      }

      final result = true;

      emit(
        state.copyWith(
          status:
              result ? RecordAudioStatus.saved : RecordAudioStatus.errorSaving,
          error: result ? '' : 'Error saving the recording',
        ),
      );
    } catch (e) {
      emit(
        const RecordAudioState(
          status: RecordAudioStatus.errorSaving,
          error: 'Error saving the recording',
        ),
      );
    } finally {
      emit(const RecordAudioState(status: RecordAudioStatus.idle));
    }
  }

  Future<void> _onParseAndSave(
    RecordAudioEvent_ParseAndSave event,
    Emitter<RecordAudioState> emit,
  ) async {
    emit(const RecordAudioState(status: RecordAudioStatus.saving));

    try {
      final lengthInBytes = event.recordingBytes.lengthInBytes;
      if (lengthInBytes <= 4096) {
        throw Exception('empty recording');
      }

      // Parse the audio to text

      // final textFromAudio = await _eventsRepository.parseAudioToText(
      //   recordingBytes: event.recordingBytes,
      // );

      emit(
        state.copyWith(
          status: RecordAudioStatus.saved,
          textFromAudio: 'textFromAudio',
        ),
      );
    } catch (e) {
      emit(const RecordAudioState(status: RecordAudioStatus.error));
    } finally {
      emit(const RecordAudioState(status: RecordAudioStatus.idle));
    }
  }
}
