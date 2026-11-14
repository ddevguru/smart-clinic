import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class StatusBadge extends StatelessWidget {
  final String status;
  final bool isLarge;

  const StatusBadge({
    super.key,
    required this.status,
    this.isLarge = false,
  });

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    String label = status.replaceAll('_', ' ');

    switch (status.toUpperCase()) {
      case 'WAITING':
      case 'QUEUED':
        bg = AppColors.softMint;
        fg = AppColors.deepTeal;
        break;
      case 'CALLED':
      case 'CHECKED_IN':
        bg = AppColors.warningBg;
        fg = AppColors.warning;
        break;
      case 'IN_CONSULTATION':
      case 'CONFIRMED':
        bg = AppColors.lightTeal;
        fg = AppColors.deepTeal;
        break;
      case 'COMPLETED':
        bg = AppColors.successBg;
        fg = AppColors.success;
        break;
      case 'CANCELLED':
      case 'NO_SHOW':
      case 'SKIPPED':
        bg = AppColors.errorBg;
        fg = AppColors.error;
        break;
      case 'SCHEDULED':
      default:
        bg = AppColors.infoBg;
        fg = AppColors.info;
        break;
    }

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isLarge ? 12 : 8,
        vertical: isLarge ? 6 : 4,
      ),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: fg.withValues(alpha: 0.3), width: 1),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: fg,
          fontSize: isLarge ? 12 : 11,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.2,
        ),
      ),
    );
  }
}

