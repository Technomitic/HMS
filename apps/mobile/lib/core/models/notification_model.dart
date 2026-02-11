class NotificationModel {
  final String id;
  final String userId;
  final String channel;
  final String title;
  final String body;
  final Map<String, dynamic>? data;
  final bool isRead;
  final String? sentAt;
  final String createdAt;

  NotificationModel({
    required this.id,
    required this.userId,
    required this.channel,
    required this.title,
    required this.body,
    this.data,
    required this.isRead,
    this.sentAt,
    required this.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      channel: json['channel'] ?? 'IN_APP',
      title: json['title'] ?? '',
      body: json['body'] ?? '',
      data: json['data'],
      isRead: json['isRead'] ?? false,
      sentAt: json['sentAt'],
      createdAt: json['createdAt'] ?? '',
    );
  }
}
