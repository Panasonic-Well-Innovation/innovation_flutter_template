import '../../models/enums/usefulness_rating.dart';
import '../../models/enums/usefulness_rating_type.dart';

sealed class UsefulnessRatings_Event {
  const UsefulnessRatings_Event();
}

class UsefulnessRatings_Event_ReportViewed extends UsefulnessRatings_Event {
  const UsefulnessRatings_Event_ReportViewed({
    required this.reportType,
  });
  final ModelEnum_UsefulnessRatingType reportType;
}

class UsefulnessRatings_Event_SurveyDismissed extends UsefulnessRatings_Event {
  const UsefulnessRatings_Event_SurveyDismissed();
}

class UsefulnessRatings_Event_SubmitRating extends UsefulnessRatings_Event {
  const UsefulnessRatings_Event_SubmitRating({
    required this.rating,
  });
  final ModelEnum_UsefulnessRating rating;
}
