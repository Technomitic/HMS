import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class StatusBadge extends StatelessWidget {
  final String status;

  const StatusBadge({super.key, required this.status});

  @override
  Widget build(BuildContext context) {
    final color = _getColor();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: Color.fromRGBO(
            color.r.toInt(), color.g.toInt(), color.b.toInt(), 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        status.replaceAll('_', ' '),
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Color _getColor() {
    switch (status) {
      case 'SCHEDULED':
      case 'ORDERED':
        return AppColors.primary;
      case 'CONFIRMED':
      case 'COMPLETED':
      case 'PAID':
        return AppColors.success;
      case 'CHECKED_IN':
      case 'PROCESSING':
      case 'SAMPLE_COLLECTED':
      case 'UNPAID':
        return AppColors.warning;
      case 'IN_PROGRESS':
        return Colors.purple;
      case 'CANCELLED':
      case 'REJECTED':
      case 'NO_SHOW':
        return AppColors.danger;
      default:
        return AppColors.textSecondary;
    }
  }
}
