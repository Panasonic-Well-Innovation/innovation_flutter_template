// coverage:ignore-file

import 'dart:async';

import 'package:audio_waveforms/audio_waveforms.dart';
import 'package:flutter/foundation.dart';

import 'platform_methods/mobile.dart'
    if (dart.library.html) 'platform_methods/web.dart'
    as platform_methods;

class RecordAudioEffect {
  StreamSubscription<RecorderState>? _subscription;

  final RecorderController recorderController = RecorderController();

  Stream<RecorderState> onRecorderStateChangedStream() {
    return recorderController.onRecorderStateChanged;
  }

  Stream<Duration> onDurationChangedStream() {
    return recorderController.onCurrentDuration;
  }

  Future<void> _cancelSubscription() async {
    if (_subscription != null) {
      await _subscription!.cancel();
    }
  }

  Future<void> start({String? eventId}) async {
    await _cancelSubscription();

    await platform_methods.recordAudioEffect_start(recorderController);
  }

  Future<void> pause() async {
    return recorderController.pause();
  }

  Future<void> resume() async {
    return recorderController.record();
  }

  Future<String?> stop() async {
    return recorderController.stop();
  }

  Future<Uint8List> getFileBytes({required String recordingPath}) async {
    return platform_methods.recordAudioEffect_getFileBytes(recordingPath);
  }

  Future<void> dispose() async {
    await _cancelSubscription();
    recorderController.dispose();
  }
}
