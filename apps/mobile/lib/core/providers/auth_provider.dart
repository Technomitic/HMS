import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../network/api_client.dart';
import '../models/user_model.dart';
import '../constants/app_constants.dart';
import 'api_provider.dart';

// Auth state
class AuthState {
  final UserModel? user;
  final bool isLoading;
  final bool isAuthenticated;
  final String? error;

  const AuthState({
    this.user,
    this.isLoading = false,
    this.isAuthenticated = false,
    this.error,
  });

  AuthState copyWith({
    UserModel? user,
    bool? isLoading,
    bool? isAuthenticated,
    String? error,
  }) {
    return AuthState(
      user: user ?? this.user,
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      error: error,
    );
  }
}

// Auth notifier
class AuthNotifier extends StateNotifier<AuthState> {
  final ApiClient _api;
  final FlutterSecureStorage _storage;

  AuthNotifier(this._api)
    : _storage = const FlutterSecureStorage(),
      super(const AuthState());

  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _api.post(
        '/auth/login',
        data: {'email': email, 'password': password},
      );

      final result = response.data['data'];
      final user = UserModel.fromJson(result['user']);

      await _storage.write(
        key: AppConstants.accessTokenKey,
        value: result['accessToken'],
      );
      await _storage.write(
        key: AppConstants.refreshTokenKey,
        value: result['refreshToken'],
      );
      await _storage.write(key: AppConstants.userRoleKey, value: user.role);
      await _storage.write(key: AppConstants.userNameKey, value: user.fullName);
      await _storage.write(key: AppConstants.userIdKey, value: user.id);
      await _storage.write(key: AppConstants.userEmailKey, value: user.email);

      state = AuthState(user: user, isAuthenticated: true, isLoading: false);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Invalid credentials');
      return false;
    }
  }

  Future<bool> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    String? phone,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final response = await _api.post(
        '/auth/register',
        data: {
          'email': email,
          'password': password,
          'firstName': firstName,
          'lastName': lastName,
          if (phone != null) 'phone': phone,
          'role': 'PATIENT',
        },
      );

      final result = response.data['data'];
      final user = UserModel.fromJson(result['user']);

      await _storage.write(
        key: AppConstants.accessTokenKey,
        value: result['accessToken'],
      );
      await _storage.write(
        key: AppConstants.refreshTokenKey,
        value: result['refreshToken'],
      );
      await _storage.write(key: AppConstants.userRoleKey, value: user.role);
      await _storage.write(key: AppConstants.userNameKey, value: user.fullName);
      await _storage.write(key: AppConstants.userIdKey, value: user.id);

      state = AuthState(user: user, isAuthenticated: true, isLoading: false);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Registration failed');
      return false;
    }
  }

  Future<void> loadProfile() async {
    final token = await _storage.read(key: AppConstants.accessTokenKey);
    if (token == null) {
      state = const AuthState(isAuthenticated: false);
      return;
    }

    try {
      final response = await _api.get('/auth/profile');
      final user = UserModel.fromJson(response.data['data']);
      state = AuthState(user: user, isAuthenticated: true);
    } catch (_) {
      state = const AuthState(isAuthenticated: false);
    }
  }

  Future<void> logout() async {
    try {
      final refreshToken = await _storage.read(
        key: AppConstants.refreshTokenKey,
      );
      if (refreshToken != null) {
        await _api.post('/auth/logout', data: {'refreshToken': refreshToken});
      }
    } catch (_) {}

    await _storage.deleteAll();
    state = const AuthState(isAuthenticated: false);
  }

  Future<String?> getStoredRole() async {
    return _storage.read(key: AppConstants.userRoleKey);
  }

  Future<String?> getStoredName() async {
    return _storage.read(key: AppConstants.userNameKey);
  }

  Future<bool> isLoggedIn() async {
    final token = await _storage.read(key: AppConstants.accessTokenKey);
    return token != null;
  }
}

// Providers
final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  final api = ref.watch(apiClientProvider);
  return AuthNotifier(api);
});
