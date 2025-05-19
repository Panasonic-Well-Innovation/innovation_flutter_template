import 'package:audio_manager/effects/record_audio/effect.dart';
import 'package:audio_manager/effects/record_audio/provider.dart';
import 'package:audio_manager/widgets/begin_recording_button.dart';
import 'package:audio_manager/widgets/floating_recording_container.dart';
import 'package:audio_manager/widgets/record_audio_listener.dart';
import 'package:audio_manager/widgets/recording_player.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class Home_Page extends StatefulWidget {
  const Home_Page({super.key});

  @override
  State<Home_Page> createState() => _Home_PageState();
}

class _Home_PageState extends State<Home_Page> {
  late RecordAudioEffect _recordAudioEffect;
  String? pendingRecordingJson;

  @override
  void initState() {
    super.initState();
    _recordAudioEffect = context.read<RecordAudioEffectProvider>().getEffect();
  }

  @override
  void dispose() {
    _recordAudioEffect.dispose();

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Audio Manager'), centerTitle: true),
      body: SafeArea(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Record Audio',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 20),
            RecordAudioListener(
              recordAudioEffect: _recordAudioEffect,
              eventId: '',
              builder:
                  ({
                    required context,
                    required stream,
                    required isSaving,
                    required isStarting,
                    required isSaved,
                    required recorderController,
                    required durationStream,
                  }) => BeginRecordingButton(
                    recordAudioEffect: _recordAudioEffect,
                    isStarting: isStarting,
                    isSaving: isSaving,
                    hasPendingRecording: true,
                  ),
            ),
            FloatingRecordingContainer(recordAudioEffect: _recordAudioEffect),
            const SizedBox(height: 64),
            Text(
              'Play Audio',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 20),
            RecordingPlayer(playerHeight: 200),
          ],
        ),
      ),
    );
  }
}
