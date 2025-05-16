import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:in_app_feedback/bloc/bloc.dart';
import 'package:in_app_feedback/bloc/events.dart';
import 'package:in_app_feedback/bloc/state.dart';
import 'package:in_app_feedback/models/enums/usefulness_rating_type.dart';

void main() {
  runApp(const UsefulnessRatingApp());
}

class UsefulnessRatingApp extends StatelessWidget {
  const UsefulnessRatingApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: BlocProvider(
        create: (context) => UsefulnessRatings_Bloc(
          initialState: UsefulnessRatings_State.initial(
            eventId: 'eventId',
          ),
        ),
        child: const Home_Page(),
      ),
    );
  }
}

class Home_Page extends StatelessWidget {
  const Home_Page({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('In-App Feedback'),
      ),
      body: Center(
        child: BlocBuilder<UsefulnessRatings_Bloc, UsefulnessRatings_State>(
          builder: (context, state) {
            return Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('Event ID: ${state.eventId}'),
                Text('Status: ${state.status}'),
                Text('Report Type: ${state.reportType?.key}'),
                Text('Question: ${state.question?.text}'),
              ],
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          context.read<UsefulnessRatings_Bloc>().add(
                const UsefulnessRatings_Event_ReportViewed(
                  reportType: ModelEnum_UsefulnessRatingType
                      .appointmentReport, // Example report type
                ),
              );
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}
