import 'dart:io';

import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';

import 'provider.dart';

/// Callback to show a dialog when the permission is not permitted.
typedef FilePickerEffect_NotPermittedCallback = void Function(
  void Function() openAppPermissionSettingsOnPhone,
);

/// An effect to pick an image
class FilePickerEffect {
  /// Default constructor
  FilePickerEffect({
    required FilePickerUtilitiesWrapper utiltiesWrapper,
  }) : _utiltiesWrapper = utiltiesWrapper;

  final FilePickerUtilitiesWrapper _utiltiesWrapper;

  /// Pick an image from the phone's camera.
  Future<File?> pickImageFromCamera({
    required FilePickerEffect_NotPermittedCallback notPermittedCallback,
    double? imageMaxWidth,
    double? imageMaxHeight,
    int? imageQuality = 100,
  }) async {
    final isPermitted =
        await _getCameraPermission(notPermittedCallback: notPermittedCallback);

    if (!isPermitted) {
      return null;
    }

    final pickedFile = await _utiltiesWrapper.pickImage(
      source: ImageSource.camera,
      imageMaxWidth: imageMaxWidth,
      imageMaxHeight: imageMaxHeight,
      imageQuality: imageQuality,
    );

    if (pickedFile == null) {
      return null;
    }

    return File(pickedFile.path);
  }

  /// Get the permission for the image picker.
  Future<bool> _getCameraPermission({
    required FilePickerEffect_NotPermittedCallback notPermittedCallback,
  }) async {
    final status = await _utiltiesWrapper.getCameraPermissionStatus();

    return _handlePermissionStatus(
      status: status,
      notPermittedCallback: notPermittedCallback,
    );
  }

  /// Pick an image from the phone's image gallery.
  Future<File?> pickImageFromStorage({
    required FilePickerEffect_NotPermittedCallback notPermittedCallback,
    double? imageMaxWidth,
    double? imageMaxHeight,
    int? imageQuality = 100,
  }) async {
    final status = await _utiltiesWrapper.getStoragePermissionStatus();

    final isPermitted = _handlePermissionStatus(
      status: status,
      notPermittedCallback: notPermittedCallback,
    );

    if (!isPermitted) {
      return null;
    }

    final pickedFile = await _utiltiesWrapper.pickImage(
      source: ImageSource.gallery,
      imageMaxWidth: imageMaxWidth,
      imageMaxHeight: imageMaxHeight,
      imageQuality: imageQuality,
    );

    if (pickedFile == null) {
      return null;
    }

    return File(pickedFile.path);
  }

  /// Pick images from the phone's image gallery.
  Future<List<File>?> pickImagesFromStorage({
    required FilePickerEffect_NotPermittedCallback notPermittedCallback,
    double? imageMaxWidth,
    double? imageMaxHeight,
    int? imageQuality = 100,
  }) async {
    final status = await _utiltiesWrapper.getStoragePermissionStatus();

    final isPermitted = _handlePermissionStatus(
      status: status,
      notPermittedCallback: notPermittedCallback,
    );

    if (!isPermitted) {
      return null;
    }

    final pickedFiles = await _utiltiesWrapper.pickImages(
      imageMaxWidth: imageMaxWidth,
      imageMaxHeight: imageMaxHeight,
      imageQuality: imageQuality,
    );

    return pickedFiles.map((file) => File(file.path)).toList();
  }

  /// Pick a file from the phone's documents directory.
  Future<List<File>?> pickFile({
    required FilePickerEffect_NotPermittedCallback notPermittedCallback,
    double? imageMaxWidth,
    double? imageMaxHeight,
    int? imageQuality = 100,
  }) async {
    final status = await _utiltiesWrapper.getStoragePermissionStatus();

    final isPermitted = _handlePermissionStatus(
      status: status,
      notPermittedCallback: notPermittedCallback,
    );

    if (!isPermitted) {
      return null;
    }

    final pickedFile = await _utiltiesWrapper.pickFiles();

    if (pickedFile == null) {
      return null;
    }

    return pickedFile.files.map((file) => File(file.path!)).toList();
  }

  bool _handlePermissionStatus({
    required PermissionStatus status,
    required FilePickerEffect_NotPermittedCallback notPermittedCallback,
  }) {
    switch (status) {
      case PermissionStatus.granted:
      case PermissionStatus.limited:
        return true;

      case PermissionStatus.denied:
      case PermissionStatus.restricted: // iOS only
      case PermissionStatus.provisional: // iOS only
      case PermissionStatus.permanentlyDenied:
        notPermittedCallback(_utiltiesWrapper.openAppPermissionSettingsOnPhone);
        return false;
    }
  }
}
