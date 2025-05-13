import 'package:bloc_concurrency/bloc_concurrency.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../outside/repositories/auth/repository.dart';
import '../../../shared/models/enums/social_sign_in_provider.dart';
import '../base.dart';
import 'events.dart';
import 'state.dart';

class SignUp_Bloc extends Bloc_Base<SignUp_Event, SignUp_State> {
  SignUp_Bloc({
    required Auth_Repository authRepository,
  })  : _authRepository = authRepository,
        super(
          const SignUp_State(
            status: SignUp_Status.idle,
            errorMessage: null,
          ),
        ) {
    on<SignUp_Event_SignUp>(
      _onSignUp,
      transformer: sequential(),
    );
    on<SignUp_Event_ResendEmailVerificationLink>(
      _onResendEmailVerificationLink,
      transformer: sequential(),
    );
    on<SignUp_Event_SocialSignUp>(
      _onSignUpWithSocial,
      transformer: sequential(),
    );
  }

  final Auth_Repository _authRepository;

  Future<void> _onSignUp(
    SignUp_Event_SignUp event,
    Emitter<SignUp_State> emit,
  ) async {
    emit(state.copyWith(status: SignUp_Status.signUpInProgress));
    try {
      await _authRepository.signUp(
        email: event.email.trim(),
        password: event.password.trim(),
      );
      emit(state.copyWith(status: SignUp_Status.signUpSuccess));
    } catch (e, stackTrace) {
      log.warning('${event.runtimeType}: error', e, stackTrace);
      emit(
        state.copyWith(
          status: SignUp_Status.signUpError,
          setErrorMessage: e.toString,
        ),
      );
    } finally {
      emit(
        state.copyWith(
          status: SignUp_Status.idle,
          setErrorMessage: () => null,
        ),
      );
    }
  }

  Future<void> _onResendEmailVerificationLink(
    SignUp_Event_ResendEmailVerificationLink event,
    Emitter<SignUp_State> emit,
  ) async {
    emit(
      state.copyWith(
        status: SignUp_Status.resendEmailVerificationLinkInProgress,
      ),
    );
    try {
      await _authRepository.resendEmailVerificationLink(
        email: event.email.trim(),
      );
      emit(
        state.copyWith(
          status: SignUp_Status.resendEmailVerificationLinkSuccess,
        ),
      );
    } catch (e, stackTrace) {
      log.warning('${event.runtimeType}: error', e, stackTrace);
      emit(
        state.copyWith(
          status: SignUp_Status.resendEmailVerificationLinkError,
          setErrorMessage: e.toString,
        ),
      );
    } finally {
      emit(
        state.copyWith(
          status: SignUp_Status.idle,
          setErrorMessage: () => null,
        ),
      );
    }
  }

  Future<void> _onSignUpWithSocial(
    SignUp_Event_SocialSignUp event,
    Emitter<SignUp_State> emit,
  ) async {
    emit(state.copyWith(status: SignUp_Status.signUpInProgress));
    try {
      switch (event.provider) {
        case ModelEnum_SocialSignInProvider.google:
          await _authRepository.signInWithGoogle();
        case ModelEnum_SocialSignInProvider.apple:
        case ModelEnum_SocialSignInProvider.facebook:
          throw Exception('Not implemented');
      }

      emit(state.copyWith(status: SignUp_Status.signUpError));
    } catch (e, stackTrace) {
      log.warning('_onSignInWithSocial: error', e, stackTrace);
      emit(
        state.copyWith(
          status: SignUp_Status.signUpError,
          setErrorMessage: e.toString,
        ),
      );
    } finally {
      emit(
        state.copyWith(
          status: SignUp_Status.idle,
          setErrorMessage: () => null,
        ),
      );
    }
  }
}
