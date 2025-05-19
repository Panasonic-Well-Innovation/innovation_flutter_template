import 'dart:typed_data';

import 'package:audio_manager/utils/converters.dart';
import 'package:equatable/equatable.dart';
import 'package:json_annotation/json_annotation.dart';

@JsonSerializable(fieldRename: FieldRename.snake)
class Model_RecordingWithError extends Equatable {
  const Model_RecordingWithError({
    required this.localPath,
    required this.recordingBytes,
    this.storagePath,
    this.recordingId,
  });

  final String localPath;
  @Uint8ListBase64Converter()
  final Uint8List recordingBytes;
  final String? storagePath;
  final String? recordingId;

  // coverage:ignore-start
  @override
  List<Object?> get props => [
    localPath,
    recordingBytes,
    storagePath,
    recordingId,
  ];

  @override
  String toString() {
    return 'Model_SaveBulkRecordingInfo(localPath: $localPath,'
        ' storagePath: $storagePath, recordingId: $recordingId)';
  }
}
