import 'package:audio_manager/app.dart';
import 'package:audio_manager/blocs/record_audio/bloc.dart';
import 'package:audio_manager/effects/play_audio/provider.dart';
import 'package:audio_manager/effects/record_audio/provider.dart';
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
      home: MultiRepositoryProvider(
        providers: [
          RepositoryProvider(create: (context) => RecordAudioEffectProvider()),
          RepositoryProvider(create: (context) => PlayAudioEffectProvider()),
        ],
        child: BlocProvider(
          create: (context) => RecordAudioBloc(),
          child: Home_Page(),
        ),
      ),
    );
  }
}
