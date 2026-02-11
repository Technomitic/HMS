import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/providers/api_provider.dart';

class AppointmentsScreen extends ConsumerStatefulWidget {
  const AppointmentsScreen({super.key});

  @override
  ConsumerState<AppointmentsScreen> createState() => _AppointmentsScreenState();
}

class _AppointmentsScreenState extends ConsumerState<AppointmentsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<Map<String, dynamic>> _appointments = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadAppointments();
  }

  Color _tint(Color color, double opacity) {
    return Color.fromRGBO(
      (color.r * 255).round(),
      (color.g * 255).round(),
      (color.b * 255).round(),
      opacity,
    );
  }

  Future<void> _loadAppointments() async {
    try {
      final api = ref.read(apiClientProvider);
      final patientRes = await api.get('/patients/me');
      final patientId = patientRes.data['data']['id'];

      final response = await api.get('/appointments', queryParameters: {
        'patientId': patientId,
        'limit': 50,
      });
      setState(() {
        _appointments = List<Map<String, dynamic>>.from(response.data['data']);
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  List<Map<String, dynamic>> get _upcoming => _appointments
      .where((a) => ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS']
          .contains(a['status']))
      .toList();

  List<Map<String, dynamic>> get _past => _appointments
      .where((a) => ['COMPLETED', 'CANCELLED', 'NO_SHOW'].contains(a['status']))
      .toList();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Appointments'),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
          indicatorColor: AppColors.primary,
          tabs: [
            Tab(text: 'Upcoming (${_upcoming.length})'),
            Tab(text: 'Past (${_past.length})'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildList(_upcoming, isEmpty: 'No upcoming appointments'),
                _buildList(_past, isEmpty: 'No past appointments'),
              ],
            ),
    );
  }

  Widget _buildList(List<Map<String, dynamic>> items,
      {required String isEmpty}) {
    if (items.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.calendar_today_rounded,
                size: 64, color: AppColors.disabled),
            const SizedBox(height: 16),
            Text(isEmpty,
                style: const TextStyle(color: AppColors.textSecondary)),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadAppointments,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: items.length,
        itemBuilder: (context, index) {
          final apt = items[index];
          final doctor = apt['doctor'] ?? {};
          final status = apt['status'] ?? '';

          Color statusColor;
          switch (status) {
            case 'CONFIRMED':
              statusColor = AppColors.success;
              break;
            case 'CHECKED_IN':
              statusColor = AppColors.warning;
              break;
            case 'COMPLETED':
              statusColor = AppColors.textSecondary;
              break;
            case 'CANCELLED':
              statusColor = AppColors.danger;
              break;
            default:
              statusColor = AppColors.primary;
          }

          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        color: AppColors.primaryLight,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Center(
                        child: Text(
                          '${doctor['firstName']?[0] ?? ''}${doctor['lastName']?[0] ?? ''}',
                          style: const TextStyle(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w700),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Dr. ${doctor['firstName'] ?? ''} ${doctor['lastName'] ?? ''}',
                            style: const TextStyle(
                                fontWeight: FontWeight.w600, fontSize: 15),
                          ),
                          Text(
                            apt['department']
                                    ?.toString()
                                    .replaceAll('_', ' ') ??
                                '',
                            style: const TextStyle(
                                color: AppColors.textSecondary, fontSize: 13),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: _tint(statusColor, 0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        status,
                        style: TextStyle(
                            color: statusColor,
                            fontSize: 11,
                            fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    const Icon(Icons.calendar_today_rounded,
                        size: 14, color: AppColors.textSecondary),
                    const SizedBox(width: 6),
                    Text(
                      _formatDate(apt['slotStart']),
                      style: const TextStyle(
                          fontSize: 13, color: AppColors.textSecondary),
                    ),
                    const SizedBox(width: 16),
                    const Icon(Icons.access_time_rounded,
                        size: 14, color: AppColors.textSecondary),
                    const SizedBox(width: 6),
                    Text(
                      _formatTime(apt['slotStart']),
                      style: const TextStyle(
                          fontSize: 13, color: AppColors.textSecondary),
                    ),
                  ],
                ),
                if (apt['chiefComplaint'] != null &&
                    (apt['chiefComplaint'] as String).isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    '"${apt['chiefComplaint']}"',
                    style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                        fontStyle: FontStyle.italic),
                  ),
                ],
              ],
            ),
          ).animate().fadeIn(delay: Duration(milliseconds: index * 50));
        },
      ),
    );
  }

  String _formatDate(String? iso) {
    if (iso == null) return '';
    final d = DateTime.parse(iso);
    final months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];
    return '${months[d.month - 1]} ${d.day}, ${d.year}';
  }

  String _formatTime(String? iso) {
    if (iso == null) return '';
    final d = DateTime.parse(iso).toLocal();
    final h = d.hour > 12 ? d.hour - 12 : (d.hour == 0 ? 12 : d.hour);
    final p = d.hour >= 12 ? 'PM' : 'AM';
    return '$h:${d.minute.toString().padLeft(2, '0')} $p';
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }
}
