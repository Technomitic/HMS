class ApiConstants {
  // For Android emulator use 10.0.2.2
  // For iOS simulator use localhost
  // For real device use your machine's IP
  static const String baseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://10.0.2.2:4000/api/v1',
  );

  static const Duration connectTimeout = Duration(seconds: 15);
  static const Duration receiveTimeout = Duration(seconds: 15);

  // Endpoints
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String refresh = '/auth/refresh';
  static const String profile = '/auth/profile';
  static const String logout = '/auth/logout';

  static const String patients = '/patients';
  static const String patientMe = '/patients/me';

  static const String doctors = '/doctors';

  static const String appointments = '/appointments';
  static const String appointmentSlots = '/appointments/slots';
  static const String doctorSchedule = '/appointments/doctor/schedule';

  static const String labReports = '/lab-reports';

  static const String invoices = '/billing/invoices';
  static const String billingSummary = '/billing/summary';

  static const String notifications = '/notifications';

  static const String dashboardAdmin = '/dashboard/admin';
  static const String dashboardDoctor = '/dashboard/doctor';
  static const String dashboardPatient = '/dashboard/patient';

  static const String health = '/health';
}
