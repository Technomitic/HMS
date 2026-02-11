import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/providers/api_provider.dart';

class LabReportsScreen extends ConsumerStatefulWidget {
  const LabReportsScreen({super.key});

  @override
  ConsumerState<LabReportsScreen> createState() => _LabReportsScreenState();
}

class _LabReportsScreenState extends ConsumerState<LabReportsScreen> {
  List<Map<String, dynamic>> _reports = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadReports();
  }

  Color _tint(Color color, double opacity) {
    return Color.fromRGBO(
      (color.r * 255).round(),
      (color.g * 255).round(),
      (color.b * 255).round(),
      opacity,
    );
  }

  Future<void> _loadReports() async {
    try {
      final api = ref.read(apiClientProvider);
      final patientRes = await api.get('/patients/me');
      final patientId = patientRes.data['data']['id'];

      final response = await api.get('/lab-reports/patient/$patientId',
          queryParameters: {'limit': 50});
      setState(() {
        _reports = List<Map<String, dynamic>>.from(response.data['data']);
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  void _showResults(Map<String, dynamic> report) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        final results = (report['results'] as Map<String, dynamic>?) ?? {};

        return DraggableScrollableSheet(
          initialChildSize: 0.6,
          maxChildSize: 0.9,
          minChildSize: 0.3,
          expand: false,
          builder: (context, scrollController) {
            return SingleChildScrollView(
              controller: scrollController,
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(
                        color: AppColors.disabled,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    report['testType'] ?? '',
                    style: const TextStyle(
                        fontSize: 20, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Completed: ${report['completedAt'] != null ? _formatDate(report['completedAt']) : 'Pending'}',
                    style: const TextStyle(
                        color: AppColors.textSecondary, fontSize: 13),
                  ),
                  const SizedBox(height: 20),
                  ...results.entries.map((entry) {
                    final result = entry.value as Map<String, dynamic>;
                    final isAbnormal = result['isAbnormal'] == true;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: isAbnormal
                            ? const Color.fromRGBO(239, 68, 68, 0.05)
                            : const Color.fromRGBO(16, 185, 129, 0.05),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isAbnormal
                              ? const Color.fromRGBO(239, 68, 68, 0.2)
                              : const Color.fromRGBO(16, 185, 129, 0.2),
                        ),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  entry.key
                                      .replaceAllMapped(RegExp(r'([A-Z])'),
                                          (m) => ' ${m.group(0)}')
                                      .trim(),
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w500),
                                ),
                                Text(
                                  'Ref: ${result['referenceRange']} ${result['unit']}',
                                  style: const TextStyle(
                                      fontSize: 12,
                                      color: AppColors.textSecondary),
                                ),
                              ],
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(
                                '${result['value']} ${result['unit']}',
                                style: TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 16,
                                  color: isAbnormal
                                      ? AppColors.danger
                                      : AppColors.success,
                                ),
                              ),
                              Text(
                                isAbnormal ? '⚠ Abnormal' : '✅ Normal',
                                style: TextStyle(
                                  fontSize: 11,
                                  color: isAbnormal
                                      ? AppColors.danger
                                      : AppColors.success,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  }),
                  if (report['notes'] != null) ...[
                    const SizedBox(height: 12),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: const Color.fromRGBO(245, 158, 11, 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Notes',
                              style: TextStyle(fontWeight: FontWeight.w600)),
                          const SizedBox(height: 4),
                          Text(report['notes'],
                              style: const TextStyle(
                                  color: AppColors.textSecondary)),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Lab Reports')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _reports.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.science_outlined,
                          size: 64, color: AppColors.disabled),
                      SizedBox(height: 16),
                      Text('No lab reports yet',
                          style: TextStyle(color: AppColors.textSecondary)),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadReports,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _reports.length,
                    itemBuilder: (context, index) {
                      final report = _reports[index];
                      final status = report['status'] ?? '';
                      final isCompleted = status == 'COMPLETED';

                      Color statusColor;
                      switch (status) {
                        case 'COMPLETED':
                          statusColor = AppColors.success;
                          break;
                        case 'PROCESSING':
                          statusColor = AppColors.warning;
                          break;
                        case 'REJECTED':
                          statusColor = AppColors.danger;
                          break;
                        default:
                          statusColor = AppColors.primary;
                      }

                      return GestureDetector(
                        onTap: isCompleted ? () => _showResults(report) : null,
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color: _tint(statusColor, 0.1),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Icon(
                                  isCompleted
                                      ? Icons.check_circle_rounded
                                      : Icons.hourglass_top_rounded,
                                  color: statusColor,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      report['testType'] ?? '',
                                      style: const TextStyle(
                                          fontWeight: FontWeight.w600),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      'Dr. ${report['orderedByUser']?['firstName'] ?? ''} ${report['orderedByUser']?['lastName'] ?? ''}',
                                      style: const TextStyle(
                                          fontSize: 12,
                                          color: AppColors.textSecondary),
                                    ),
                                  ],
                                ),
                              ),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: _tint(statusColor, 0.1),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      status,
                                      style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w600,
                                          color: statusColor),
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    _formatDate(report['createdAt']),
                                    style: const TextStyle(
                                        fontSize: 11,
                                        color: AppColors.textSecondary),
                                  ),
                                ],
                              ),
                              if (isCompleted) ...[
                                const SizedBox(width: 8),
                                const Icon(Icons.chevron_right_rounded,
                                    color: AppColors.textSecondary),
                              ],
                            ],
                          ),
                        ),
                      )
                          .animate()
                          .fadeIn(delay: Duration(milliseconds: index * 50));
                    },
                  ),
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
    return '${months[d.month - 1]} ${d.day}';
  }
}
