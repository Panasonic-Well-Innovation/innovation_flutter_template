import 'dart:io';

import 'package:file_manager/widgets/pick_image_dialog.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../../effects/file_picker/provider.dart';

class Home_Page extends StatefulWidget {
  const Home_Page({super.key});

  @override
  State<Home_Page> createState() => _Home_PageState();
}

class _Home_PageState extends State<Home_Page> {
  bool isPickingImage = false;

  final List<File> _selectedFiles = [];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      elevation: 0,
                      backgroundColor: CupertinoColors.systemGrey.withOpacity(
                        0.12,
                      ),
                      foregroundColor: CupertinoColors.systemBlue,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                    ),
                    onPressed: isPickingImage ? null : _onTakePhoto,
                    child: const Text(
                      'Take a Photo',
                      style: TextStyle(fontSize: 15, letterSpacing: -0.24),
                    ),
                  ),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      elevation: 0,
                      backgroundColor: CupertinoColors.systemGrey.withOpacity(
                        0.12,
                      ),
                      foregroundColor: CupertinoColors.systemBlue,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                    ),
                    onPressed: isPickingImage ? null : _onPickPhoto,
                    child: const Text(
                      'Add Photos',
                      style: TextStyle(fontSize: 15, letterSpacing: -0.24),
                    ),
                  ),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      elevation: 0,
                      backgroundColor: CupertinoColors.systemGrey.withOpacity(
                        0.12,
                      ),
                      foregroundColor: CupertinoColors.systemBlue,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                    ),
                    onPressed: isPickingImage ? null : _onPickFile,
                    child: const Text(
                      'Add Files',
                      style: TextStyle(fontSize: 15, letterSpacing: -0.24),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              ..._selectedFiles.map(
                (file) => Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  child: Text(
                    file.path.split('/').last,
                    style: const TextStyle(
                      fontSize: 14,
                      color: CupertinoColors.systemGrey,
                      letterSpacing: -0.24,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _onPickPhoto() async {
    setState(() {
      isPickingImage = true;
    });
    final filePickerEffect =
        context.read<FilePickerEffectProvider>().getEffect();
    final _images = await filePickerEffect.pickImagesFromStorage(
      notPermittedCallback: (openAppPermissionSettingsOnPhone) {
        showDialog<dynamic>(
          context: context,
          builder: (dialogContext) {
            return PickImageDialog(
              title: 'Access required',
              subtitle:
                  'To upload your image, please go to '
                  'your settings and allow photo access.',
              openAppPermissionSettingsOnPhone:
                  openAppPermissionSettingsOnPhone,
            );
          },
        );
      },
    );

    setState(() {
      isPickingImage = false;
      if (_images != null) {
        _selectedFiles.addAll(_images);
      }
    });
  }

  Future<void> _onPickFile() async {
    setState(() {
      isPickingImage = true;
    });
    final filePickerEffect =
        context.read<FilePickerEffectProvider>().getEffect();
    final _files = await filePickerEffect.pickFile(
      notPermittedCallback: (openAppPermissionSettingsOnPhone) {
        showDialog<dynamic>(
          context: context,
          builder: (dialogContext) {
            return PickImageDialog(
              title: 'Access required',
              subtitle:
                  'To upload your file, please go to '
                  'your settings and allow photo access.',
              openAppPermissionSettingsOnPhone:
                  openAppPermissionSettingsOnPhone,
            );
          },
        );
      },
    );

    setState(() {
      isPickingImage = false;
      if (_files != null) {
        _selectedFiles.addAll(_files);
      }
    });
  }

  Future<void> _onTakePhoto() async {
    setState(() {
      isPickingImage = true;
    });

    final filePickerEffect =
        context.read<FilePickerEffectProvider>().getEffect();
    final _imageFile = await filePickerEffect.pickImageFromCamera(
      notPermittedCallback: (openAppPermissionSettingsOnPhone) {
        showDialog<dynamic>(
          context: context,
          builder: (dialogContext) {
            return PickImageDialog(
              title: 'Camera access needed',
              subtitle:
                  'To take a photo, please go to your '
                  'settings and allow camera access.',
              openAppPermissionSettingsOnPhone:
                  openAppPermissionSettingsOnPhone,
            );
          },
        );
      },
    );

    setState(() {
      isPickingImage = false;
      if (_imageFile != null) {
        _selectedFiles.add(_imageFile);
      }
    });
  }
}
