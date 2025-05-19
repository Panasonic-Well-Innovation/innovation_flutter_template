import 'package:equatable/equatable.dart';

enum PlayAudioStatus { idle, error, play, pause, resume, stop, loading, loaded }

class PlayAudioState extends Equatable {
  const PlayAudioState({
    required this.status,
    this.combinedFilePath,
    this.localPaths,
  });

  final PlayAudioStatus status;
  final String? combinedFilePath;
  final List<String>? localPaths;

  PlayAudioState copyWith({
    PlayAudioStatus? status,
    String? combinedFilePath,
    List<String>? localPaths,
  }) {
    return PlayAudioState(
      status: status ?? this.status,
      combinedFilePath: combinedFilePath ?? this.combinedFilePath,
      localPaths: localPaths ?? this.localPaths,
    );
  }

  @override
  List<Object?> get props => [status, combinedFilePath, localPaths];
}
