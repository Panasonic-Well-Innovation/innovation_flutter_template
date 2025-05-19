import 'dart:io';

import 'package:device_info_plus/device_info_plus.dart';
import 'package:file_picker/file_picker.dart';
import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';

import 'effect.dart';

/// [FilePickerEffect] Provider
class FilePickerEffectProvider {
  /// Default constructor
  FilePickerEffectProvider({
    required this.filePickerUtilitiesWrapper,
  });

  /// Wrapper for file picker and utility packages
  final FilePickerUtilitiesWrapper filePickerUtilitiesWrapper;

  /// Get [FilePickerEffect]
  FilePickerEffect getEffect() {
    return FilePickerEffect(
      utiltiesWrapper: filePickerUtilitiesWrapper,
    );
  }
}

// coverage:ignore-start
/// Wrapper for file picker and utility packages
class FilePickerUtilitiesWrapper {
  final List<String> _supportedExtensions = [
    'pdf',
    'docx',
    'csv',
    'txt',
    'html',
    'odt',
    'rtf',
    'epub',
    'json',
  ];

  /// Pick an image from the phone.
  Future<XFile?> pickImage({
    required ImageSource source,
    double? imageMaxWidth,
    double? imageMaxHeight,
    int? imageQuality,
  }) async {
    return ImagePicker().pickImage(
      source: source,
      maxWidth: imageMaxWidth,
      maxHeight: imageMaxHeight,
      imageQuality: imageQuality,
    );
  }

  /// Pick multiple images from the phone.
  Future<List<XFile>> pickImages({
    double? imageMaxWidth,
    double? imageMaxHeight,
    int? imageQuality,
  }) async {
    return ImagePicker().pickMultiImage(
      maxWidth: imageMaxWidth,
      maxHeight: imageMaxHeight,
      imageQuality: imageQuality,
    );
  }

  /// Get the permission status for accessing photos in storage.
  Future<PermissionStatus> getStoragePermissionStatus() async {
    if (Platform.isAndroid) {
      final deviceInfo = DeviceInfoPlugin();
      final androidInfo = await deviceInfo.androidInfo;

      return androidInfo.version.sdkInt >= 33
          ? await Permission.photos.request()
          : await Permission.storage.request();
    }

    // If the platform is not Android, then it is iOS.
    return Permission.photos.request();
  }

  /// Get the permission status for accessing the camera.
  Future<PermissionStatus> getCameraPermissionStatus() async {
    return Permission.camera.request();
  }

  /// Open the phone's permission settings.
  Future<void> openAppPermissionSettingsOnPhone() async {
    await openAppSettings();
  }

  /// Pick files from the phone.
  Future<FilePickerResult?> pickFiles({
    List<String>? supportedExtensions,
    bool allowMultiple = true,
  }) async {
    return FilePicker.platform.pickFiles(
      allowedExtensions: supportedExtensions ?? _supportedExtensions,
      type: FileType.custom,
      allowMultiple: allowMultiple,
    );
  }
}
// coverage:ignore-end
