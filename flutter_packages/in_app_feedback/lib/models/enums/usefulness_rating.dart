enum ModelEnum_UsefulnessRating {
  stronglyAgree('Strongly Agree'),
  agree('Agree'),
  neutral('Neutral'),
  disagree('Disagree'),
  stronglyDisagree('Strongly Disagree');

  final String name;
  const ModelEnum_UsefulnessRating(this.name);
}
