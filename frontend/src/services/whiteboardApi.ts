import axios from 'axios';
import type { WhiteboardElement, WhiteboardState } from '../types/ai-teacher';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface WhiteboardAPI {
  getWhiteboardState: (sessionId: string) => Promise<WhiteboardState | null>;
  saveWhiteboardState: (whiteboardState: WhiteboardState) => Promise<WhiteboardState>;
  addElement: (sessionId: string, element: WhiteboardElement) => Promise<WhiteboardElement>;
  updateElement: (sessionId: string, element: WhiteboardElement) => Promise<WhiteboardElement>;
  deleteElement: (sessionId: string, elementId: string) => Promise<void>;
  clearWhiteboard: (sessionId: string) => Promise<void>;
  createSnapshot: (sessionId: string, description?: string) => Promise<any>;
  getSnapshots: (sessionId: string) => Promise<any[]>;
  restoreSnapshot: (sessionId: string, snapshotId: string) => Promise<WhiteboardState>;
}

class WhiteboardApiService implements WhiteboardAPI {
  private getAuthHeaders() {
    const token = localStorage.getItem('accessToken');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async getWhiteboardState(sessionId: string): Promise<WhiteboardState | null> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/whiteboard/${sessionId}`,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null; // No whiteboard state exists yet
      }
      console.error('Error fetching whiteboard state:', error);
      throw new Error('Failed to fetch whiteboard state');
    }
  }

  async saveWhiteboardState(whiteboardState: WhiteboardState): Promise<WhiteboardState> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/whiteboard/${whiteboardState.sessionId}`,
        whiteboardState,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error saving whiteboard state:', error);
      throw new Error('Failed to save whiteboard state');
    }
  }

  async addElement(sessionId: string, element: WhiteboardElement): Promise<WhiteboardElement> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/whiteboard/${sessionId}/elements`,
        element,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error adding whiteboard element:', error);
      throw new Error('Failed to add whiteboard element');
    }
  }

  async updateElement(sessionId: string, element: WhiteboardElement): Promise<WhiteboardElement> {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/whiteboard/${sessionId}/elements/${element.id}`,
        element,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error updating whiteboard element:', error);
      throw new Error('Failed to update whiteboard element');
    }
  }

  async deleteElement(sessionId: string, elementId: string): Promise<void> {
    try {
      await axios.delete(
        `${API_BASE_URL}/api/whiteboard/${sessionId}/elements/${elementId}`,
        { headers: this.getAuthHeaders() }
      );
    } catch (error) {
      console.error('Error deleting whiteboard element:', error);
      throw new Error('Failed to delete whiteboard element');
    }
  }

  async clearWhiteboard(sessionId: string): Promise<void> {
    try {
      await axios.delete(
        `${API_BASE_URL}/api/whiteboard/${sessionId}/clear`,
        { headers: this.getAuthHeaders() }
      );
    } catch (error) {
      console.error('Error clearing whiteboard:', error);
      throw new Error('Failed to clear whiteboard');
    }
  }

  async createSnapshot(sessionId: string, description?: string): Promise<any> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/whiteboard/${sessionId}/snapshots`,
        { description },
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error creating whiteboard snapshot:', error);
      throw new Error('Failed to create whiteboard snapshot');
    }
  }

  async getSnapshots(sessionId: string): Promise<any[]> {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/whiteboard/${sessionId}/snapshots`,
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error fetching whiteboard snapshots:', error);
      throw new Error('Failed to fetch whiteboard snapshots');
    }
  }

  async restoreSnapshot(sessionId: string, snapshotId: string): Promise<WhiteboardState> {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/whiteboard/${sessionId}/snapshots/${snapshotId}/restore`,
        {},
        { headers: this.getAuthHeaders() }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error restoring whiteboard snapshot:', error);
      throw new Error('Failed to restore whiteboard snapshot');
    }
  }
}

export const whiteboardApi = new WhiteboardApiService();
