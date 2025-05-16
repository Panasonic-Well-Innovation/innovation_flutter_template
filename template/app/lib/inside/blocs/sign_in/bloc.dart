import 'package:bloc_concurrency/bloc_concurrency.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../outside/repositories/auth/repository.dart';
import '../../../shared/models/enums/social_sign_in_provider.dart';
import '../base.dart';
import 'events.dart';
import 'state.dart';

class SignIn_Bloc extends Bloc_Base<SignIn_Event, SignIn_State> {
  SignIn_Bloc({
    required Auth_Repository authRepository,
  })  : _authRepository = authRepository,
        super(
          const SignIn_State(
            status: SignIn_Status.idle,
            errorMessage: null,
          ),
        ) {
    on<SignIn_Event_SignIn>(_onSignIn, transformer: sequential());
    on<SignIn_Event_SocialSignIn>(
      _onSignInWithSocial,
      transformer: sequential(),
    );
  }

  final Auth_Repository _authRepository;

  Future<void> _onSignIn(
    SignIn_Event_SignIn event,
    Emitter<SignIn_State> emit,
  ) async {
    emit(state.copyWith(status: SignIn_Status.signInInProgress));
    try {
      await _authRepository.signIn(
        email: event.email.trim(),
        password: event.password.trim(),
      );
      emit(state.copyWith(status: SignIn_Status.signInSuccess));
    } catch (e, stackTrace) {
      log.warning('${event.runtimeType}: error', e, stackTrace);
      emit(
        state.copyWith(
          status: SignIn_Status.signInError,
          setErrorMessage: e.toString,
        ),
      );
    } finally {
      emit(
        state.copyWith(
          status: SignIn_Status.idle,
          setErrorMessage: () => null,
        ),
      );
    }
  }

  Future<void> _onSignInWithSocial(
    SignIn_Event_SocialSignIn event,
    Emitter<SignIn_State> emit,
  ) async {
    emit(state.copyWith(status: SignIn_Status.signInInProgress));
    try {
      switch (event.provider) {
        case ModelEnum_SocialSignInProvider.google:
          await _authRepository.signInWithGoogle();
        case ModelEnum_SocialSignInProvider.apple:
          await _authRepository.signInWithApple();
        case ModelEnum_SocialSignInProvider.facebook:
          throw Exception('Not implemented');
      }

      emit(state.copyWith(status: SignIn_Status.signInSuccess));
    } catch (e, stackTrace) {
      log.warning('_onSignInWithSocial: error', e, stackTrace);
      emit(
        state.copyWith(
          status: SignIn_Status.signInError,
          setErrorMessage: e.toString,
        ),
      );
    } finally {
      emit(
        state.copyWith(
          status: SignIn_Status.idle,
          setErrorMessage: () => null,
        ),
      );
    }
  }
}
