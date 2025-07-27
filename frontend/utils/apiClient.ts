import { auth } from '../firebase';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiClient {
  private async getAuthToken(): Promise<string | null> {
    try {
      if (auth.currentUser) {
        return await auth.currentUser.getIdToken();
      }
      return null;
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const token = await this.getAuthToken();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: headers as HeadersInit,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Auth endpoints
  async signIn(email: string, password: string): Promise<ApiResponse> {
    return this.makeRequest('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async signUp(email: string, password: string, displayName?: string): Promise<ApiResponse> {
    return this.makeRequest('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
  }

  // Profile endpoints
  async getProfile(): Promise<ApiResponse> {
    return this.makeRequest('/api/profile');
  }

  async updateProfile(data: { displayName?: string; photoURL?: string }): Promise<ApiResponse> {
    return this.makeRequest('/api/profile/update', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async uploadProfilePhoto(formData: FormData): Promise<ApiResponse> {
    const token = await this.getAuthToken();
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/profile/upload-photo`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        } as HeadersInit,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Saved locations endpoints
  async getSavedLocations(): Promise<ApiResponse> {
    return this.makeRequest('/api/saved-locations/get');
  }

  async addSavedLocation(name: string): Promise<ApiResponse> {
    return this.makeRequest('/api/saved-locations/add', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async deleteSavedLocation(id: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/saved-locations/delete/${id}`, {
      method: 'DELETE',
    });
  }

  // Friend request endpoints
  async getFriendRequests(): Promise<ApiResponse> {
    return this.makeRequest('/api/friend-requests/get');
  }

  async sendFriendRequest(recipientId: string): Promise<ApiResponse> {
    return this.makeRequest('/api/friend-requests/send', {
      method: 'POST',
      body: JSON.stringify({ recipientId }),
    });
  }

  async respondToFriendRequest(requestId: string, accept: boolean): Promise<ApiResponse> {
    return this.makeRequest('/api/friend-requests/respond', {
      method: 'POST',
      body: JSON.stringify({ requestId, accept }),
    });
  }

  // Shared locations endpoints
  async getSharedLocations(): Promise<ApiResponse> {
    return this.makeRequest('/api/shared-locations/get');
  }

  async shareLocation(data: {
    latitude: number;
    longitude: number;
    friendIds: string[];
    duration?: number;
  }): Promise<ApiResponse> {
    return this.makeRequest('/api/shared-locations/share', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async stopSharingLocation(shareId: string): Promise<ApiResponse> {
    return this.makeRequest(`/api/shared-locations/stop/${shareId}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
