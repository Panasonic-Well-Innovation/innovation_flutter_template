import 'package:equatable/equatable.dart';

import '../../models/enums/usefulness_rating_type.dart';
import '../../models/rating_question.dart';

enum UsefulnessRatings_Status {
  idle,
  loading,
  loaded,
  error,
  dismissed,
  rated,
}

class UsefulnessRatings_State extends Equatable {
  final UsefulnessRatings_Status status;
  final String? eventId;
  final Model_RatingQuestion? question;
  final ModelEnum_UsefulnessRatingType? reportType;

  const UsefulnessRatings_State({
    this.eventId,
    this.reportType,
    this.question,
    this.status = UsefulnessRatings_Status.idle,
  });

  factory UsefulnessRatings_State.initial({required String eventId}) =>
      UsefulnessRatings_State(
        eventId: eventId,
        status: UsefulnessRatings_Status.idle,
      );

  UsefulnessRatings_State copyWith({
    UsefulnessRatings_Status? status,
    String? eventId,
    Model_RatingQuestion? question,
    ModelEnum_UsefulnessRatingType? reportType,
  }) {
    return UsefulnessRatings_State(
      status: status ?? this.status,
      eventId: eventId ?? this.eventId,
      question: question ?? this.question,
      reportType: reportType ?? this.reportType,
    );
  }

  @override
  List<Object?> get props => [
        status,
        eventId,
        question,
        reportType,
      ];
}
