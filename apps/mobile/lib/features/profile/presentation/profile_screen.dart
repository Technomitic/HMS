import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/providers/api_provider.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/utils/date_utils.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final _storage = const FlutterSecureStorage();
  Map<String, dynamic>? _user;
  Map<String, dynamic>? _patient;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    try {
      final api = ref.read(apiClientProvider);

      final profileRes = await api.get('/auth/profile');
      _user = profileRes.data['data'] as Map<String, dynamic>;

      try {
        final patientRes = await api.get('/patients/me');
        _patient = patientRes.data['data'] as Map<String, dynamic>;
      } catch (_) {
        // Patient profile may not exist
      }
    } catch (_) {
      // Handle error
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _logout() async {
    try {
      final api = ref.read(apiClientProvider);
      final refreshToken =
          await _storage.read(key: AppConstants.refreshTokenKey);
      if (refreshToken != null) {
        await api.post('/auth/logout', data: {'refreshToken': refreshToken});
      }
    } catch (_) {}

    await _storage.deleteAll();
    if (mounted) context.go('/login');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadProfile,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    // Avatar
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [AppColors.primary, AppColors.accent],
                        ),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Center(
                        child: Text(
                          '${_user?['firstName']?[0] ?? ''}${_user?['lastName']?[0] ?? ''}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 28,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ).animate().fadeIn().scale(begin: const Offset(0.8, 0.8)),

                    const SizedBox(height: 16),
                    Text(
                      '${_user?['firstName'] ?? ''} ${_user?['lastName'] ?? ''}',
                      style: const TextStyle(
                          fontSize: 22, fontWeight: FontWeight.w700),
                    ),
                    Text(
                      _user?['email'] ?? '',
                      style: const TextStyle(color: AppColors.textSecondary),
                    ),
                    if (_patient?['mrn'] != null) ...[
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.primaryLight,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          'MRN: ${_patient!['mrn']}',
                          style: const TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],

                    const SizedBox(height: 32),

                    // Info Cards
                    if (_patient != null) ...[
                      _buildSection('Personal Information', [
                        _buildInfoRow('Date of Birth',
                            AppDateUtils.formatDate(_patient?['dateOfBirth'])),
                        _buildInfoRow(
                            'Gender',
                            (_patient?['gender'] ?? '')
                                .toString()
                                .toLowerCase()),
                        _buildInfoRow(
                            'Blood Group', _patient?['bloodGroup'] ?? '—'),
                        _buildInfoRow('Phone', _user?['phone'] ?? '—'),
                      ]),
                      const SizedBox(height: 16),
                      if ((_patient?['allergies'] as List?)?.isNotEmpty == true)
                        _buildSection('Allergies', [
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: (_patient!['allergies'] as List).map((a) {
                              return Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 12, vertical: 6),
                                decoration: BoxDecoration(
                                  color: AppColors.danger
                                      .withFractionalOpacity(0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  a.toString(),
                                  style: const TextStyle(
                                    color: AppColors.danger,
                                    fontWeight: FontWeight.w500,
                                    fontSize: 13,
                                  ),
                                ),
                              );
                            }).toList(),
                          ),
                        ]),
                      const SizedBox(height: 16),
                      _buildSection('Emergency Contact', [
                        _buildInfoRow(
                            'Name', _patient?['emergencyName'] ?? '—'),
                        _buildInfoRow(
                            'Phone', _patient?['emergencyPhone'] ?? '—'),
                        _buildInfoRow(
                            'Relation', _patient?['emergencyRelation'] ?? '—'),
                      ]),
                    ],

                    const SizedBox(height: 32),

                    // Logout
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _logout,
                        icon: const Icon(Icons.logout_rounded),
                        label: const Text('Sign Out'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.danger,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                      ),
                    ),

                    const SizedBox(height: 16),

                    Text(
                      'Medix Hospital v1.0.0',
                      style: TextStyle(
                        color:
                            AppColors.textSecondary.withFractionalOpacity(0.5),
                        fontSize: 12,
                      ),
                    ),

                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildSection(String title, List<Widget> children) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 15,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 12),
          ...children,
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: const TextStyle(
                  color: AppColors.textSecondary, fontSize: 14)),
          Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14),
          ),
        ],
      ),
    );
  }
}
