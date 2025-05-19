// coverage:ignore-file

import 'dart:async';
import 'dart:io';
import 'dart:typed_data';

import 'package:audio_waveforms/audio_waveforms.dart';

import 'package:path_provider/path_provider.dart';

class PlayAudioEffect {
  final PlayerController playerController = PlayerController();
  List<double>? waveformData;
  StreamSubscription<PlayerState>? _subscription;
  StreamSubscription<Duration?>? _durationChangedSubscription;

  Stream<PlayerState> onStateChangedStream() {
    return playerController.onPlayerStateChanged;
  }

  Stream<void> onCompletionStream() {
    return playerController.onCompletion;
  }

  Stream<int> onDurationChangedStream() {
    return playerController.onCurrentDurationChanged;
  }

  Future<void> _cancelSubscription() async {
    if (_subscription != null) {
      await _subscription!.cancel();
    }
    if (_durationChangedSubscription != null) {
      await _durationChangedSubscription!.cancel();
    }
  }

  Future<void> prepareFile(Uint8List recordingBytes) async {
    await _cancelSubscription();
    final tempDir = await getTemporaryDirectory();
    final path = '${tempDir.path}/temp_audio.m4a';
    final tempFile = File(path);
    await tempFile.writeAsBytes(recordingBytes);

    await playerController.preparePlayer(path: tempFile.path);
  }

  Future<void> prepareFileWithPath(String path) async {
    await playerController.preparePlayer(path: path);
  }

  Future<void> start({bool forceRefresh = true}) async {
    return playerController.startPlayer(forceRefresh: forceRefresh);
  }

  Future<void> pause() async {
    return playerController.pausePlayer();
  }

  Future<void> resume() async {
    return playerController.startPlayer();
  }

  Future<void> stop() async {
    return playerController.stopPlayer();
  }

  Future<void> dispose() async {
    await _cancelSubscription();
    playerController.dispose();
  }
}
