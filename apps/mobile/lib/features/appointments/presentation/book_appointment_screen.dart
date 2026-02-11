import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/providers/api_provider.dart';

class BookAppointmentScreen extends ConsumerStatefulWidget {
  const BookAppointmentScreen({super.key});

  @override
  ConsumerState<BookAppointmentScreen> createState() =>
      _BookAppointmentScreenState();
}

class _BookAppointmentScreenState extends ConsumerState<BookAppointmentScreen> {
  int _currentStep = 0;
  String? _selectedDept;
  Map<String, dynamic>? _selectedDoctor;
  String _selectedDate = '';
  Map<String, dynamic>? _selectedSlot;
  String _complaint = '';

  List<Map<String, dynamic>> _doctors = [];
  List<Map<String, dynamic>> _slots = [];
  bool _isLoading = false;
  bool _isBooking = false;

  final _departments = [
    {
      'id': 'CARDIOLOGY',
      'name': 'Cardiology',
      'icon': Icons.favorite_rounded,
      'color': Colors.red
    },
    {
      'id': 'NEUROLOGY',
      'name': 'Neurology',
      'icon': Icons.psychology_rounded,
      'color': Colors.purple
    },
    {
      'id': 'ORTHOPEDICS',
      'name': 'Orthopedics',
      'icon': Icons.accessibility_new_rounded,
      'color': Colors.blue
    },
    {
      'id': 'PEDIATRICS',
      'name': 'Pediatrics',
      'icon': Icons.child_care_rounded,
      'color': Colors.pink
    },
    {
      'id': 'GENERAL_MEDICINE',
      'name': 'General',
      'icon': Icons.medical_services_rounded,
      'color': Colors.green
    },
    {
      'id': 'DERMATOLOGY',
      'name': 'Dermatology',
      'icon': Icons.spa_rounded,
      'color': Colors.orange
    },
  ];

  Future<void> _loadDoctors() async {
    setState(() => _isLoading = true);
    try {
      final api = ref.read(apiClientProvider);
      final response = await api.get('/doctors', queryParameters: {
        'department': _selectedDept,
        'limit': 20,
      });
      setState(() {
        _doctors = List<Map<String, dynamic>>.from(response.data['data']);
      });
    } catch (e) {
      _showError('Failed to load doctors');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _loadSlots() async {
    if (_selectedDoctor == null || _selectedDate.isEmpty) return;
    setState(() => _isLoading = true);
    try {
      final api = ref.read(apiClientProvider);
      final doctorId = _selectedDoctor!['user']['id'];
      final response = await api.get(
        '/appointments/slots/$doctorId',
        queryParameters: {'date': _selectedDate},
      );
      setState(() {
        _slots = List<Map<String, dynamic>>.from(response.data['data']);
      });
    } catch (e) {
      _showError('Failed to load slots');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _bookAppointment() async {
    setState(() => _isBooking = true);
    try {
      final api = ref.read(apiClientProvider);
      await api.post('/appointments', data: {
        'doctorId': _selectedDoctor!['user']['id'],
        'department': _selectedDept,
        'slotStart': _selectedSlot!['start'],
        'slotEnd': _selectedSlot!['end'],
        'chiefComplaint': _complaint,
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ Appointment booked successfully!'),
            backgroundColor: AppColors.success,
          ),
        );
        context.go('/');
      }
    } catch (e) {
      _showError('Booking failed. Please try again.');
    } finally {
      setState(() => _isBooking = false);
    }
  }

  void _showError(String message) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message), backgroundColor: AppColors.danger),
      );
    }
  }

  String _formatTime(String isoDate) {
    final date = DateTime.parse(isoDate).toLocal();
    final hour =
        date.hour > 12 ? date.hour - 12 : (date.hour == 0 ? 12 : date.hour);
    final period = date.hour >= 12 ? 'PM' : 'AM';
    return '${hour.toString()}:${date.minute.toString().padLeft(2, '0')} $period';
  }

  String _getNextWeekday() {
    var d = DateTime.now().add(const Duration(days: 1));
    while (d.weekday == DateTime.saturday || d.weekday == DateTime.sunday) {
      d = d.add(const Duration(days: 1));
    }
    return d.toIso8601String().split('T')[0];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Book Appointment'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () {
            if (_currentStep > 0) {
              setState(() => _currentStep--);
            } else {
              context.go('/');
            }
          },
        ),
      ),
      body: Column(
        children: [
          // Progress indicator
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            child: Row(
              children: List.generate(4, (index) {
                return Expanded(
                  child: Container(
                    height: 4,
                    margin: const EdgeInsets.symmetric(horizontal: 2),
                    decoration: BoxDecoration(
                      color: index <= _currentStep
                          ? AppColors.primary
                          : AppColors.border,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                );
              }),
            ),
          ),

          // Step content
          Expanded(
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 300),
              child: _buildCurrentStep(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCurrentStep() {
    switch (_currentStep) {
      case 0:
        return _buildDepartmentStep();
      case 1:
        return _buildDoctorStep();
      case 2:
        return _buildSlotStep();
      case 3:
        return _buildConfirmStep();
      default:
        return const SizedBox();
    }
  }

  Widget _buildDepartmentStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Select Department',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700),
          ).animate().fadeIn(),
          const SizedBox(height: 8),
          const Text(
            'Choose the medical specialty you need',
            style: TextStyle(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 24),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.3,
            ),
            itemCount: _departments.length,
            itemBuilder: (context, index) {
              final dept = _departments[index];
              final isSelected = _selectedDept == dept['id'];

              return GestureDetector(
                onTap: () {
                  setState(() => _selectedDept = dept['id'] as String);
                  _loadDoctors();
                  setState(() => _currentStep = 1);
                },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  decoration: BoxDecoration(
                    color:
                        isSelected ? AppColors.primaryLight : AppColors.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: isSelected ? AppColors.primary : AppColors.border,
                      width: isSelected ? 2 : 1,
                    ),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(dept['icon'] as IconData,
                          size: 36, color: dept['color'] as Color),
                      const SizedBox(height: 8),
                      Text(
                        dept['name'] as String,
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          color: isSelected
                              ? AppColors.primary
                              : AppColors.textPrimary,
                        ),
                      ),
                    ],
                  ),
                ).animate().fadeIn(delay: Duration(milliseconds: index * 80)),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildDoctorStep() {
    return _isLoading
        ? const Center(child: CircularProgressIndicator())
        : ListView.builder(
            padding: const EdgeInsets.all(20),
            itemCount: _doctors.length + 1,
            itemBuilder: (context, index) {
              if (index == 0) {
                return const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Choose Doctor',
                      style:
                          TextStyle(fontSize: 24, fontWeight: FontWeight.w700),
                    ),
                    SizedBox(height: 16),
                  ],
                );
              }

              final doc = _doctors[index - 1];
              final user = doc['user'] ?? {};

              return GestureDetector(
                onTap: () {
                  setState(() {
                    _selectedDoctor = doc;
                    _selectedDate = _getNextWeekday();
                  });
                  _loadSlots();
                  setState(() => _currentStep = 2);
                },
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
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          color: AppColors.primaryLight,
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Center(
                          child: Text(
                            '${user['firstName']?[0] ?? ''}${user['lastName']?[0] ?? ''}',
                            style: const TextStyle(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w700,
                              fontSize: 18,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Dr. ${user['firstName'] ?? ''} ${user['lastName'] ?? ''}',
                              style: const TextStyle(
                                  fontWeight: FontWeight.w600, fontSize: 16),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              doc['specialization'] ?? '',
                              style: const TextStyle(
                                  color: AppColors.textSecondary, fontSize: 13),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                const Icon(Icons.star_rounded,
                                    size: 16, color: Colors.amber),
                                const Text(' 4.8  •  ',
                                    style: TextStyle(fontSize: 12)),
                                Text(
                                  '${doc['experienceYears'] ?? 0} yrs',
                                  style: const TextStyle(
                                      fontSize: 12,
                                      color: AppColors.textSecondary),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            '\$${((doc['consultationFee'] ?? 0) / 100).toStringAsFixed(0)}',
                            style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 18,
                              color: AppColors.primary,
                            ),
                          ),
                          const Text('per visit',
                              style: TextStyle(
                                  fontSize: 11,
                                  color: AppColors.textSecondary)),
                        ],
                      ),
                    ],
                  ),
                ),
              )
                  .animate()
                  .fadeIn(delay: Duration(milliseconds: (index - 1) * 60));
            },
          );
  }

  Widget _buildSlotStep() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Select Time',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 8),
          Text(
            'Dr. ${_selectedDoctor?['user']?['firstName'] ?? ''} ${_selectedDoctor?['user']?['lastName'] ?? ''}',
            style: const TextStyle(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 20),

          // Date picker
          GestureDetector(
            onTap: () async {
              final date = await showDatePicker(
                context: context,
                initialDate: DateTime.now().add(const Duration(days: 1)),
                firstDate: DateTime.now(),
                lastDate: DateTime.now().add(const Duration(days: 60)),
              );
              if (date != null) {
                setState(() {
                  _selectedDate = date.toIso8601String().split('T')[0];
                  _selectedSlot = null;
                });
                _loadSlots();
              }
            },
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                children: [
                  const Icon(Icons.calendar_today_rounded,
                      color: AppColors.primary),
                  const SizedBox(width: 12),
                  Text(
                    _selectedDate.isNotEmpty ? _selectedDate : 'Select date',
                    style: const TextStyle(fontWeight: FontWeight.w500),
                  ),
                  const Spacer(),
                  const Icon(Icons.chevron_right_rounded,
                      color: AppColors.textSecondary),
                ],
              ),
            ),
          ),

          const SizedBox(height: 20),

          if (_isLoading)
            const Center(
                child: Padding(
                    padding: EdgeInsets.all(32),
                    child: CircularProgressIndicator()))
          else if (_slots.where((s) => s['available'] == true).isEmpty)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(32),
                child: Text('No available slots for this date',
                    style: TextStyle(color: AppColors.textSecondary)),
              ),
            )
          else
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: _slots.map((slot) {
                final isAvailable = slot['available'] == true;
                final isSelected = _selectedSlot?['start'] == slot['start'];

                return GestureDetector(
                  onTap: isAvailable
                      ? () => setState(() => _selectedSlot = slot)
                      : null,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? AppColors.primary
                          : isAvailable
                              ? AppColors.surface
                              : AppColors.background,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: isSelected
                            ? AppColors.primary
                            : isAvailable
                                ? AppColors.border
                                : AppColors.disabled,
                      ),
                    ),
                    child: Text(
                      _formatTime(slot['start']),
                      style: TextStyle(
                        fontWeight: FontWeight.w500,
                        color: isSelected
                            ? Colors.white
                            : isAvailable
                                ? AppColors.textPrimary
                                : AppColors.disabled,
                        decoration:
                            isAvailable ? null : TextDecoration.lineThrough,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),

          const SizedBox(height: 24),

          // Complaint field
          TextField(
            onChanged: (val) => _complaint = val,
            maxLines: 3,
            decoration: const InputDecoration(
              labelText: 'Reason for visit (optional)',
              hintText: 'Briefly describe your symptoms...',
              alignLabelWithHint: true,
            ),
          ),

          const SizedBox(height: 24),

          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: _selectedSlot != null
                  ? () => setState(() => _currentStep = 3)
                  : null,
              child: const Text('Continue'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildConfirmStep() {
    final user = _selectedDoctor?['user'] ?? {};

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Confirm Booking',
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 20),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              children: [
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: AppColors.primaryLight,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Center(
                    child: Text(
                      '${user['firstName']?[0] ?? ''}${user['lastName']?[0] ?? ''}',
                      style: const TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w700,
                          fontSize: 22),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Dr. ${user['firstName'] ?? ''} ${user['lastName'] ?? ''}',
                  style: const TextStyle(
                      fontSize: 18, fontWeight: FontWeight.w600),
                ),
                Text(
                  _selectedDoctor?['specialization'] ?? '',
                  style: const TextStyle(color: AppColors.textSecondary),
                ),
                const SizedBox(height: 20),
                const Divider(),
                const SizedBox(height: 16),
                _ConfirmRow(
                    label: 'Department',
                    value: _selectedDept?.replaceAll('_', ' ') ?? ''),
                _ConfirmRow(label: 'Date', value: _selectedDate),
                _ConfirmRow(
                    label: 'Time',
                    value: _selectedSlot != null
                        ? _formatTime(_selectedSlot!['start'])
                        : ''),
                _ConfirmRow(
                  label: 'Fee',
                  value:
                      '\$${((_selectedDoctor?['consultationFee'] ?? 0) / 100).toStringAsFixed(0)}',
                  valueColor: AppColors.primary,
                ),
                if (_complaint.isNotEmpty)
                  _ConfirmRow(label: 'Reason', value: _complaint),
              ],
            ),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: _isBooking ? null : _bookAppointment,
              child: _isBooking
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white))
                  : const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.check_circle_outline_rounded),
                        SizedBox(width: 8),
                        Text('Confirm Appointment'),
                      ],
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ConfirmRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;

  const _ConfirmRow(
      {required this.label, required this.value, this.valueColor});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppColors.textSecondary)),
          Text(
            value,
            style: TextStyle(
                fontWeight: FontWeight.w600,
                color: valueColor ?? AppColors.textPrimary),
          ),
        ],
      ),
    );
  }
}
