class InvoiceModel {
  final String id;
  final String invoiceNumber;
  final String patientId;
  final String appointmentId;
  final List<dynamic> items;
  final int subtotalCents;
  final int taxCents;
  final int discountCents;
  final int totalCents;
  final String status;
  final String dueDate;
  final String? paidAt;
  final String? paymentMethod;
  final String createdAt;

  InvoiceModel({
    required this.id,
    required this.invoiceNumber,
    required this.patientId,
    required this.appointmentId,
    required this.items,
    required this.subtotalCents,
    required this.taxCents,
    required this.discountCents,
    required this.totalCents,
    required this.status,
    required this.dueDate,
    this.paidAt,
    this.paymentMethod,
    required this.createdAt,
  });

  factory InvoiceModel.fromJson(Map<String, dynamic> json) {
    return InvoiceModel(
      id: json['id'] ?? '',
      invoiceNumber: json['invoiceNumber'] ?? '',
      patientId: json['patientId'] ?? '',
      appointmentId: json['appointmentId'] ?? '',
      items: json['items'] ?? [],
      subtotalCents: json['subtotalCents'] ?? 0,
      taxCents: json['taxCents'] ?? 0,
      discountCents: json['discountCents'] ?? 0,
      totalCents: json['totalCents'] ?? 0,
      status: json['status'] ?? 'UNPAID',
      dueDate: json['dueDate'] ?? '',
      paidAt: json['paidAt'],
      paymentMethod: json['paymentMethod'],
      createdAt: json['createdAt'] ?? '',
    );
  }

  String get totalFormatted => '\$${(totalCents / 100).toStringAsFixed(2)}';
  bool get isPaid => status == 'PAID';
  bool get isOverdue =>
      status == 'UNPAID' &&
      DateTime.tryParse(dueDate)?.isBefore(DateTime.now()) == true;
}
