import 'package:auto_route/auto_route.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:forui/forui.dart';
import 'package:permission_handler/permission_handler.dart';

import '../../../cubits/notifications/cubit.dart';
import '../../../util/breakpoints.dart';
import '../../widgets/scaffold.dart';
import 'widgets/header.dart';

@RoutePage()
class Home_Page extends StatefulWidget {
  const Home_Page({super.key});

  @override
  State<Home_Page> createState() => _Home_PageState();
}

class _Home_PageState extends State<Home_Page> with WidgetsBindingObserver {
  late Future<NotificationSettings> _notificationSettings;

  @override
  void initState() {
    _notificationSettings =
        context.read<Notifications_Cubit>().getNotificationSettings();
    WidgetsBinding.instance.addObserver(this);
    super.initState();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      setState(() {
        _notificationSettings =
            context.read<Notifications_Cubit>().getNotificationSettings();
      });
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Routes_Scaffold(
      breakpointType: InsideUtil_BreakpointType.constrained,
      scaffold: FScaffold(
        header: const Home_Header(),
        content: SingleChildScrollView(
          child: Column(
            children: [
              FutureBuilder(
                future: _notificationSettings,
                builder: (context, snapshot) {
                  if (snapshot.hasData) {
                    return FSwitch(
                      label: const Text('Enabled notifications'),
                      value: snapshot.data!.authorizationStatus ==
                          AuthorizationStatus.authorized,
                      onChange: (value) {
                        openAppSettings();
                      },
                    );
                  }
                  return const SizedBox.shrink();
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
