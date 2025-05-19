import 'package:file_manager/effects/file_picker/provider.dart';
import 'package:file_manager/home_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

void main() {
  runApp(const MainApp());
}

class MainApp extends StatelessWidget {
  const MainApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: RepositoryProvider(
        create:
            (context) => FilePickerEffectProvider(
              filePickerUtilitiesWrapper: FilePickerUtilitiesWrapper(),
            ),
        child: Home_Page(),
      ),
    );
  }
}
