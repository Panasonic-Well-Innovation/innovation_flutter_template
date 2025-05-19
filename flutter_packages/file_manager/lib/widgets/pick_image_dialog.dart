import 'package:flutter/material.dart';

class PickImageDialog extends StatelessWidget {
  const PickImageDialog({
    required this.title,
    required this.subtitle,
    required this.openAppPermissionSettingsOnPhone,
    super.key,
  });

  final String title;
  final String subtitle;
  final void Function() openAppPermissionSettingsOnPhone;

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.of(context);
    return Card(
      child: Container(
        height: mq.size.height * 0.1,
        width: mq.size.width * 0.8,
        padding: EdgeInsets.all(16),
        // constraints: BoxConstraints(maxWidth: mq.size.width * 0.8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          // crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(title),
            SizedBox(height: 16),
            Text(subtitle),
            SizedBox(height: 16),
            Row(
              children: [
                ElevatedButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                  },
                  child: const Text('Cancel'),
                ),
                SizedBox(width: 8),
                FilledButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                    openAppPermissionSettingsOnPhone();
                  },
                  child: const Text('Open Settings'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
