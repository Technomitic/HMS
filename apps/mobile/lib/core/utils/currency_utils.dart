import 'package:intl/intl.dart';

class CurrencyUtils {
  static String formatCents(int? cents) {
    if (cents == null) return '\$0.00';
    return NumberFormat.simpleCurrency(locale: 'en_US').format(cents / 100);
  }

  static String formatDollars(double amount) {
    return NumberFormat.simpleCurrency(locale: 'en_US').format(amount);
  }
}
