import 'package:equatable/equatable.dart';
import 'package:json_annotation/json_annotation.dart';

part 'state.g.dart';

enum RecordAudioStatus {
  idle,
  error,
  record,
  pause,
  resume,
  stop,
  saving,
  saved,
  errorSaving,
}

@JsonSerializable()
class RecordAudioState extends Equatable {
  const RecordAudioState({
    required this.status,
    this.textFromAudio,
    this.error,
  });

  final RecordAudioStatus status;
  final String? textFromAudio;
  final String? error;

  RecordAudioState copyWith({
    RecordAudioStatus? status,
    String? textFromAudio,
    String? error,
  }) {
    return RecordAudioState(
      status: status ?? this.status,
      textFromAudio: textFromAudio ?? this.textFromAudio,
      error: error ?? this.error,
    );
  }

  @override
  List<Object?> get props => [
        status,
        textFromAudio,
        error,
      ];

  // coverage:ignore-start
  factory RecordAudioState.fromJson(Map<String, dynamic> json) =>
      _$RecordAudioStateFromJson(json);

  Map<String, dynamic> toJson() => _$RecordAudioStateToJson(this);
  // coverage:ignore-end
}
