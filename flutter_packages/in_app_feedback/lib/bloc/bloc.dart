import 'dart:async';

import 'package:flutter_bloc/flutter_bloc.dart';

import '../../models/enums/usefulness_rating_type.dart';
import '../../models/rating_question.dart';
import 'events.dart';
import 'state.dart';

// Map of report types to their corresponding questions
// Could evolved into a list of questions
Map<ModelEnum_UsefulnessRatingType, Model_RatingQuestion>
    reportTypeToQuestions = {
  ModelEnum_UsefulnessRatingType.appointmentReport: const Model_RatingQuestion(
    text: 'I feel more prepared and confident'
        ' based on that visit preparation report.',
  ),
  ModelEnum_UsefulnessRatingType.appointmentSynopsis:
      const Model_RatingQuestion(
    text: 'The after-visit summary makes the '
        'discussion and care plan easy to understand.',
  ),
};

class UsefulnessRatings_Bloc
    extends Bloc<UsefulnessRatings_Event, UsefulnessRatings_State> {
  UsefulnessRatings_Bloc({
    required UsefulnessRatings_State initialState,
  }) : super(initialState) {
    // When a report is fully viewed
    on<UsefulnessRatings_Event_ReportViewed>(_onReportViewed);

    // When the user submits a rating
    on<UsefulnessRatings_Event_SubmitRating>(_onSubmitRating);

    // When the survey prompt is dismissed
    on<UsefulnessRatings_Event_SurveyDismissed>(_onSurveyDismissed);
  }

  FutureOr<void> _onReportViewed(
    UsefulnessRatings_Event_ReportViewed event,
    Emitter<UsefulnessRatings_State> emit,
  ) async {
    emit(
      state.copyWith(
        reportType: event.reportType,
        question: reportTypeToQuestions[event.reportType],
        status: UsefulnessRatings_Status.loaded,
      ),
    );

    emit(
      state.copyWith(
        status: UsefulnessRatings_Status.idle,
      ),
    );
  }

  FutureOr<void> _onSurveyDismissed(
    UsefulnessRatings_Event_SurveyDismissed event,
    Emitter<UsefulnessRatings_State> emit,
  ) async {
    emit(
      state.copyWith(
        status: UsefulnessRatings_Status.dismissed,
      ),
    );
  }

  FutureOr<void> _onSubmitRating(
    UsefulnessRatings_Event_SubmitRating event,
    Emitter<UsefulnessRatings_State> emit,
  ) async {
    try {
      emit(
        state.copyWith(
          question: state.question!.copyWith(
            rating: event.rating,
          ),
          status: UsefulnessRatings_Status.loading,
        ),
      );

      // Submit the rating to the repository

      // await _repository.submitUsefulnessRating(
      //   eventId: state.eventId!,
      //   reportType: state.reportType!,
      //   rating: state.question!.rating!,
      // );

      emit(
        state.copyWith(
          status: UsefulnessRatings_Status.rated,
        ),
      );
    } catch (e) {
      emit(
        state.copyWith(
          status: UsefulnessRatings_Status.error,
          question: state.question!.copyWith(
            rating: event.rating,
          ),
        ),
      );
    } finally {
      emit(state.copyWith(status: UsefulnessRatings_Status.idle));
    }
  }
}
