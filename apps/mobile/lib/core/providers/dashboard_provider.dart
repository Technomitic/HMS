import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'api_provider.dart';

final patientDashboardProvider = FutureProvider<Map<String, dynamic>>((
  ref,
) async {
  final api = ref.watch(apiClientProvider);
  final response = await api.get('/dashboard/patient');
  return response.data['data'] as Map<String, dynamic>;
});

final doctorDashboardProvider = FutureProvider<Map<String, dynamic>>((
  ref,
) async {
  final api = ref.watch(apiClientProvider);
  final response = await api.get('/dashboard/doctor');
  return response.data['data'] as Map<String, dynamic>;
});

final doctorsListProvider =
    FutureProvider.family<List<Map<String, dynamic>>, String?>((
      ref,
      department,
    ) async {
      final api = ref.watch(apiClientProvider);
      final params = <String, dynamic>{'limit': 20};
      if (department != null) params['department'] = department;
      final response = await api.get('/doctors', queryParameters: params);
      return List<Map<String, dynamic>>.from(response.data['data']);
    });

final appointmentSlotsProvider =
    FutureProvider.family<
      List<Map<String, dynamic>>,
      ({String doctorId, String date})
    >((ref, params) async {
      final api = ref.watch(apiClientProvider);
      final response = await api.get(
        '/appointments/slots/${params.doctorId}',
        queryParameters: {'date': params.date},
      );
      return List<Map<String, dynamic>>.from(response.data['data']);
    });

final patientAppointmentsProvider = FutureProvider<List<Map<String, dynamic>>>((
  ref,
) async {
  final api = ref.watch(apiClientProvider);
  try {
    final patientRes = await api.get('/patients/me');
    final patientId = patientRes.data['data']['id'];
    final response = await api.get(
      '/appointments',
      queryParameters: {'patientId': patientId, 'limit': 50},
    );
    return List<Map<String, dynamic>>.from(response.data['data']);
  } catch (_) {
    return [];
  }
});

final patientLabReportsProvider = FutureProvider<List<Map<String, dynamic>>>((
  ref,
) async {
  final api = ref.watch(apiClientProvider);
  try {
    final patientRes = await api.get('/patients/me');
    final patientId = patientRes.data['data']['id'];
    final response = await api.get(
      '/lab-reports/patient/$patientId',
      queryParameters: {'limit': 50},
    );
    return List<Map<String, dynamic>>.from(response.data['data']);
  } catch (_) {
    return [];
  }
});

final notificationsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final api = ref.watch(apiClientProvider);
  final response = await api.get(
    '/notifications',
    queryParameters: {'limit': 20},
  );
  return response.data as Map<String, dynamic>;
});
