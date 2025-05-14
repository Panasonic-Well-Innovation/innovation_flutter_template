// dart format width=80
// GENERATED CODE - DO NOT MODIFY BY HAND

// **************************************************************************
// AutoRouterGenerator
// **************************************************************************

// ignore_for_file: type=lint
// coverage:ignore-file

part of 'router.dart';

/// generated route for
/// [Authenticated_Router]
class Authenticated_Routes extends PageRouteInfo<void> {
  const Authenticated_Routes({List<PageRouteInfo>? children})
    : super(Authenticated_Routes.name, initialChildren: children);

  static const String name = 'Authenticated_Routes';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const Authenticated_Router();
    },
  );
}

/// generated route for
/// [EmailVerificationLinkSent_Page]
class EmailVerificationLinkSent_Route extends PageRouteInfo<void> {
  const EmailVerificationLinkSent_Route({List<PageRouteInfo>? children})
    : super(EmailVerificationLinkSent_Route.name, initialChildren: children);

  static const String name = 'EmailVerificationLinkSent_Route';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return WrappedRoute(child: const EmailVerificationLinkSent_Page());
    },
  );
}

/// generated route for
/// [ForgotPasswordFlow_Router]
class ForgotPasswordFlow_Routes extends PageRouteInfo<void> {
  const ForgotPasswordFlow_Routes({List<PageRouteInfo>? children})
    : super(ForgotPasswordFlow_Routes.name, initialChildren: children);

  static const String name = 'ForgotPasswordFlow_Routes';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const ForgotPasswordFlow_Router();
    },
  );
}

/// generated route for
/// [ForgotPassword_Page]
class ForgotPassword_Route extends PageRouteInfo<void> {
  const ForgotPassword_Route({List<PageRouteInfo>? children})
    : super(ForgotPassword_Route.name, initialChildren: children);

  static const String name = 'ForgotPassword_Route';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return WrappedRoute(child: const ForgotPassword_Page());
    },
  );
}

/// generated route for
/// [Home_Page]
class Home_Route extends PageRouteInfo<void> {
  const Home_Route({List<PageRouteInfo>? children})
    : super(Home_Route.name, initialChildren: children);

  static const String name = 'Home_Route';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const Home_Page();
    },
  );
}

/// generated route for
/// [ResetPasswordLinkSent_Page]
class ResetPasswordLinkSent_Route
    extends PageRouteInfo<ResetPasswordLinkSent_RouteArgs> {
  ResetPasswordLinkSent_Route({
    String? email,
    Key? key,
    List<PageRouteInfo>? children,
  }) : super(
         ResetPasswordLinkSent_Route.name,
         args: ResetPasswordLinkSent_RouteArgs(email: email, key: key),
         rawQueryParams: {'email': email},
         initialChildren: children,
       );

  static const String name = 'ResetPasswordLinkSent_Route';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      final queryParams = data.queryParams;
      final args = data.argsAs<ResetPasswordLinkSent_RouteArgs>(
        orElse:
            () => ResetPasswordLinkSent_RouteArgs(
              email: queryParams.optString('email'),
            ),
      );
      return WrappedRoute(
        child: ResetPasswordLinkSent_Page(email: args.email, key: args.key),
      );
    },
  );
}

class ResetPasswordLinkSent_RouteArgs {
  const ResetPasswordLinkSent_RouteArgs({this.email, this.key});

  final String? email;

  final Key? key;

  @override
  String toString() {
    return 'ResetPasswordLinkSent_RouteArgs{email: $email, key: $key}';
  }
}

/// generated route for
/// [ResetPassword_Page]
class ResetPassword_Route extends PageRouteInfo<void> {
  const ResetPassword_Route({List<PageRouteInfo>? children})
    : super(ResetPassword_Route.name, initialChildren: children);

  static const String name = 'ResetPassword_Route';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return WrappedRoute(child: const ResetPassword_Page());
    },
  );
}

/// generated route for
/// [SignIn_Page]
class SignIn_Route extends PageRouteInfo<void> {
  const SignIn_Route({List<PageRouteInfo>? children})
    : super(SignIn_Route.name, initialChildren: children);

  static const String name = 'SignIn_Route';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return WrappedRoute(child: const SignIn_Page());
    },
  );
}

/// generated route for
/// [SignUp_Page]
class SignUp_Route extends PageRouteInfo<void> {
  const SignUp_Route({List<PageRouteInfo>? children})
    : super(SignUp_Route.name, initialChildren: children);

  static const String name = 'SignUp_Route';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return WrappedRoute(child: const SignUp_Page());
    },
  );
}

/// generated route for
/// [Unauthenticated_Router]
class Unauthenticated_Routes extends PageRouteInfo<void> {
  const Unauthenticated_Routes({List<PageRouteInfo>? children})
    : super(Unauthenticated_Routes.name, initialChildren: children);

  static const String name = 'Unauthenticated_Routes';

  static PageInfo page = PageInfo(
    name,
    builder: (data) {
      return const Unauthenticated_Router();
    },
  );
}
