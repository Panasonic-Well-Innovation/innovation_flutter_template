import 'dart:typed_data';

import '../../models/recording_with_error.dart';

sealed class RecordAudioEvent {}

class RecordAudioEvent_Error extends RecordAudioEvent {
  final String? errorMessage;

  RecordAudioEvent_Error({
    this.errorMessage,
  });
}

class RecordAudioEvent_Record extends RecordAudioEvent {}

class RecordAudioEvent_Pause extends RecordAudioEvent {}

class RecordAudioEvent_Resume extends RecordAudioEvent {}

class RecordAudioEvent_Stop extends RecordAudioEvent {}

class RecordAudioEvent_ParseAndSave extends RecordAudioEvent {
  RecordAudioEvent_ParseAndSave({
    required this.recordingBytes,
    required this.recordingPath,
  });

  final Uint8List recordingBytes;
  final String recordingPath;
}

class RecordAudioEvent_Save extends RecordAudioEvent {
  RecordAudioEvent_Save({
    required this.recordingBytes,
    required this.recordingPath,
    required this.eventId,
    this.recordingId,
    this.previousSavedPath,
  });

  final Uint8List recordingBytes;
  final String recordingPath;
  final String eventId;
  final String? recordingId;
  final String? previousSavedPath;
}

class RecordAudioEvent_SaveBulk extends RecordAudioEvent {
  RecordAudioEvent_SaveBulk({
    required this.recordings,
    required this.eventId,
  });

  final List<Model_RecordingWithError> recordings;
  final String eventId;
}
