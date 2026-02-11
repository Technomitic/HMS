class LabReportModel {
  final String id;
  final String appointmentId;
  final String patientId;
  final String orderedBy;
  final String testType;
  final String testCategory;
  final String status;
  final Map<String, dynamic>? results;
  final String? reportPdfUrl;
  final String? notes;
  final String? completedAt;
  final String createdAt;
  final Map<String, dynamic>? orderedByUser;

  LabReportModel({
    required this.id,
    required this.appointmentId,
    required this.patientId,
    required this.orderedBy,
    required this.testType,
    required this.testCategory,
    required this.status,
    this.results,
    this.reportPdfUrl,
    this.notes,
    this.completedAt,
    required this.createdAt,
    this.orderedByUser,
  });

  factory LabReportModel.fromJson(Map<String, dynamic> json) {
    return LabReportModel(
      id: json['id'] ?? '',
      appointmentId: json['appointmentId'] ?? '',
      patientId: json['patientId'] ?? '',
      orderedBy: json['orderedBy'] ?? '',
      testType: json['testType'] ?? '',
      testCategory: json['testCategory'] ?? '',
      status: json['status'] ?? 'ORDERED',
      results: json['results'],
      reportPdfUrl: json['reportPdfUrl'],
      notes: json['notes'],
      completedAt: json['completedAt'],
      createdAt: json['createdAt'] ?? '',
      orderedByUser: json['orderedByUser'],
    );
  }

  bool get isCompleted => status == 'COMPLETED';

  String get orderedByName {
    if (orderedByUser == null) return 'Doctor';
    return 'Dr. ${orderedByUser!['firstName'] ?? ''} ${orderedByUser!['lastName'] ?? ''}'
        .trim();
  }
}
