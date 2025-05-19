sealed class PlayAudioEvent {}

class PlayAudioEvent_Init extends PlayAudioEvent {
  PlayAudioEvent_Init({
    required this.recordingPaths,
  });

  final List<String> recordingPaths;
}

class PlayAudioEvent_Error extends PlayAudioEvent {}

class PlayAudioEvent_Play extends PlayAudioEvent {}

class PlayAudioEvent_Pause extends PlayAudioEvent {}

class PlayAudioEvent_Resume extends PlayAudioEvent {}

class PlayAudioEvent_Stop extends PlayAudioEvent {}

class PlayAudioEvent_Reset extends PlayAudioEvent {
  PlayAudioEvent_Reset({
    required this.recordingPaths,
  });

  final List<String> recordingPaths;
}
