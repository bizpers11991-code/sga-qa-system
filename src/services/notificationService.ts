// services/notificationService.ts

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'division_request' | 'project_update' | 'qa_review';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
}

export interface NotificationFilter {
  types?: Notification['type'][];
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
}

class NotificationService {
  private notifications: Notification[] = [];
  private listeners: Set<(notifications: Notification[]) => void> = new Set();

  constructor() {
    // Load from localStorage on init
    this.loadFromStorage();

    // Simulate real-time notifications (in production, this would be WebSocket/SignalR)
    this.simulateRealTimeNotifications();
  }

  /**
   * Add a new notification
   */
  addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): Notification {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false
    };

    this.notifications.unshift(newNotification);
    this.saveToStorage();
    this.notifyListeners();

    // Show browser notification if permitted
    this.showBrowserNotification(newNotification);

    return newNotification;
  }

  /**
   * Get all notifications with optional filtering
   */
  getNotifications(filter?: NotificationFilter): Notification[] {
    let filtered = [...this.notifications];

    // Filter by type
    if (filter?.types && filter.types.length > 0) {
      filtered = filtered.filter(n => filter.types!.includes(n.type));
    }

    // Filter unread only
    if (filter?.unreadOnly) {
      filtered = filtered.filter(n => !n.read);
    }

    // Apply pagination
    const offset = filter?.offset || 0;
    const limit = filter?.limit || filtered.length;

    return filtered.slice(offset, offset + limit);
  }

  /**
   * Get unread count
   */
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  /**
   * Mark notification as read
   */
  markAsRead(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification && !notification.read) {
      notification.read = true;
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    let changed = false;
    this.notifications.forEach(n => {
      if (!n.read) {
        n.read = true;
        changed = true;
      }
    });

    if (changed) {
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  /**
   * Delete a notification
   */
  deleteNotification(id: string): void {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      this.notifications.splice(index, 1);
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this.notifications = [];
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Subscribe to notification updates
   */
  subscribe(callback: (notifications: Notification[]) => void): () => void {
    this.listeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Request browser notification permission
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  /**
   * Show browser notification
   */
  private async showBrowserNotification(notification: Notification): Promise<void> {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const icon = this.getIconForType(notification.type);

    try {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/logo192.png',
        badge: '/logo192.png',
        tag: notification.id,
        requireInteraction: notification.type === 'error' || notification.type === 'division_request',
        data: {
          url: notification.actionUrl
        }
      });

      browserNotification.onclick = () => {
        window.focus();
        if (notification.actionUrl) {
          window.location.href = notification.actionUrl;
        }
        browserNotification.close();
      };
    } catch (error) {
      console.error('Failed to show browser notification:', error);
    }
  }

  /**
   * Get icon emoji for notification type
   */
  private getIconForType(type: Notification['type']): string {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'warning':
        return '⚠️';
      case 'division_request':
        return '↔️';
      case 'project_update':
        return '📁';
      case 'qa_review':
        return '✓';
      default:
        return 'ℹ️';
    }
  }

  /**
   * Save notifications to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = JSON.stringify(this.notifications);
      localStorage.setItem('sga_notifications', data);
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  }

  /**
   * Load notifications from localStorage
   */
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem('sga_notifications');
      if (data) {
        const parsed = JSON.parse(data);
        // Convert timestamp strings back to Date objects
        this.notifications = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      this.notifications = [];
    }
  }

  /**
   * Notify all listeners of changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener([...this.notifications]);
      } catch (error) {
        console.error('Notification listener error:', error);
      }
    });
  }

  /**
   * Simulate real-time notifications (for demo purposes)
   * In production, this would be replaced with WebSocket/SignalR
   */
  private simulateRealTimeNotifications(): void {
    // This is just for demonstration
    // In production, you'd connect to a real-time service like:
    // - SignalR
    // - WebSocket
    // - Server-Sent Events
    // - Firebase Cloud Messaging
    // - Azure Notification Hubs
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Convenience functions for creating notifications

export const notifyDivisionRequestReceived = (requestId: string, fromDivision: string, projectName: string) => {
  return notificationService.addNotification({
    type: 'division_request',
    title: 'New Division Request',
    message: `${fromDivision} division needs assistance with ${projectName}`,
    actionUrl: `/division-requests/inbox`,
    actionLabel: 'View Request',
    metadata: { requestId, fromDivision, projectName }
  });
};

export const notifyDivisionRequestResponse = (requestId: string, accepted: boolean, byDivision: string) => {
  return notificationService.addNotification({
    type: accepted ? 'success' : 'warning',
    title: `Division Request ${accepted ? 'Accepted' : 'Rejected'}`,
    message: `${byDivision} has ${accepted ? 'accepted' : 'rejected'} your request`,
    actionUrl: `/division-requests/outbox`,
    actionLabel: 'View Details',
    metadata: { requestId, accepted, byDivision }
  });
};

export const notifyProjectStatusChange = (projectId: string, projectName: string, oldStatus: string, newStatus: string) => {
  return notificationService.addNotification({
    type: 'project_update',
    title: 'Project Status Updated',
    message: `${projectName} status changed from ${oldStatus} to ${newStatus}`,
    actionUrl: `/projects/${projectId}`,
    actionLabel: 'View Project',
    metadata: { projectId, projectName, oldStatus, newStatus }
  });
};

export const notifyQAReviewRequired = (qaPackId: string, projectName: string) => {
  return notificationService.addNotification({
    type: 'qa_review',
    title: 'QA Review Required',
    message: `QA Pack for ${projectName} is ready for review`,
    actionUrl: `/qa-pack/${qaPackId}`,
    actionLabel: 'Review Now',
    metadata: { qaPackId, projectName }
  });
};

export const notifyJobAssigned = (jobId: string, jobNumber: string, location: string) => {
  return notificationService.addNotification({
    type: 'info',
    title: 'New Job Assigned',
    message: `Job ${jobNumber} at ${location} has been assigned to you`,
    actionUrl: `/jobs/${jobId}`,
    actionLabel: 'View Job',
    metadata: { jobId, jobNumber, location }
  });
};

export default notificationService;
