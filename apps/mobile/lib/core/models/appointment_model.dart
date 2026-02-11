class AppointmentModel {
  final String id;
  final String patientId;
  final String doctorId;
  final String department;
  final String slotStart;
  final String slotEnd;
  final String status;
  final String type;
  final String? chiefComplaint;
  final String? notes;
  final String? diagnosis;
  final Map<String, dynamic>? vitals;
  final List<dynamic>? prescription;
  final Map<String, dynamic>? doctor;
  final Map<String, dynamic>? patient;

  AppointmentModel({
    required this.id,
    required this.patientId,
    required this.doctorId,
    required this.department,
    required this.slotStart,
    required this.slotEnd,
    required this.status,
    this.type = 'OPD',
    this.chiefComplaint,
    this.notes,
    this.diagnosis,
    this.vitals,
    this.prescription,
    this.doctor,
    this.patient,
  });

  factory AppointmentModel.fromJson(Map<String, dynamic> json) {
    return AppointmentModel(
      id: json['id'] ?? '',
      patientId: json['patientId'] ?? '',
      doctorId: json['doctorId'] ?? '',
      department: json['department'] ?? '',
      slotStart: json['slotStart'] ?? '',
      slotEnd: json['slotEnd'] ?? '',
      status: json['status'] ?? 'SCHEDULED',
      type: json['type'] ?? 'OPD',
      chiefComplaint: json['chiefComplaint'],
      notes: json['notes'],
      diagnosis: json['diagnosis'],
      vitals: json['vitals'],
      prescription: json['prescription'],
      doctor: json['doctor'],
      patient: json['patient'],
    );
  }

  String get doctorName {
    if (doctor == null) return 'Doctor';
    return 'Dr. ${doctor!['firstName'] ?? ''} ${doctor!['lastName'] ?? ''}'
        .trim();
  }

  String get patientName {
    if (patient == null) return 'Patient';
    final user = patient!['user'];
    if (user == null) return 'Patient';
    return '${user['firstName'] ?? ''} ${user['lastName'] ?? ''}'.trim();
  }

  String get departmentDisplay => department.replaceAll('_', ' ');
}
