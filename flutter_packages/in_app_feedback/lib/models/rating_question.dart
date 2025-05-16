import 'enums/usefulness_rating.dart';

class Model_RatingQuestion {
  final String text;
  final ModelEnum_UsefulnessRating?
      rating; // The user’s answer (null if not yet answered)

  const Model_RatingQuestion({
    required this.text,
    this.rating,
  });

  Model_RatingQuestion copyWith({
    String? text,
    ModelEnum_UsefulnessRating? rating,
  }) {
    return Model_RatingQuestion(
      text: text ?? this.text,
      rating: rating ?? this.rating,
    );
  }
}
