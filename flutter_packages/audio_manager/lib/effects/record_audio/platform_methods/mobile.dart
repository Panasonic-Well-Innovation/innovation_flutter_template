// coverage:ignore-file
import 'dart:io';
import 'dart:typed_data';

import 'package:audio_waveforms/audio_waveforms.dart';

// ignore: depend_on_referenced_packages
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

Future<void> recordAudioEffect_start(RecorderController recorder) async {
  final dir = await getApplicationDocumentsDirectory();
  final path = p.join(
    dir.path,
    'recording_${DateTime.now().toIso8601String()}.m4a',
  );

  await recorder.record(path: path);
}

Future<Uint8List> recordAudioEffect_getFileBytes(String recordingPath) async {
  final recordingBytes = await File(recordingPath).readAsBytes();

  return recordingBytes;
}
