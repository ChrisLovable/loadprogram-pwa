// Notification system for role-based task alerts

export interface Notification {
  id: string
  role: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  timestamp: string
  read: boolean
}

export class NotificationManager {
  private static instance: NotificationManager
  private notifications: Notification[] = []
  private listeners: ((notifications: Notification[]) => void)[] = []

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager()
    }
    return NotificationManager.instance
  }

  constructor() {
    // Load notifications from localStorage
    const stored = localStorage.getItem('notifications')
    if (stored) {
      this.notifications = JSON.parse(stored)
    }
  }

  private saveToStorage() {
    localStorage.setItem('notifications', JSON.stringify(this.notifications))
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.notifications))
  }

  addNotification(role: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
    const notification: Notification = {
      id: Date.now().toString(),
      role,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false
    }

    this.notifications.unshift(notification) // Add to beginning
    this.saveToStorage()
    this.notifyListeners()

    // Show browser notification if supported
    this.showBrowserNotification(message, role)

    console.log(`Notification sent to ${role}: ${message}`)
  }

  getNotificationsForRole(role: string): Notification[] {
    return this.notifications.filter(n => n.role === role)
  }

  getUnreadCountForRole(role: string): number {
    return this.notifications.filter(n => n.role === role && !n.read).length
  }

  markAsRead(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
      this.saveToStorage()
      this.notifyListeners()
    }
  }

  markAllAsReadForRole(role: string) {
    this.notifications
      .filter(n => n.role === role)
      .forEach(n => n.read = true)
    this.saveToStorage()
    this.notifyListeners()
  }

  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.push(listener)
    // Immediately call with current notifications
    listener(this.notifications)
  }

  unsubscribe(listener: (notifications: Notification[]) => void) {
    this.listeners = this.listeners.filter(l => l !== listener)
  }

  private async showBrowserNotification(message: string, role: string) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Load Approval - ${role}`, {
        body: message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: role // Replace previous notifications for same role
      })
    } else if ('Notification' in window && Notification.permission === 'default') {
      // Request permission
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        new Notification(`Load Approval - ${role}`, {
          body: message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: role
        })
      }
    }
  }

  // Workflow-specific notification triggers
  notifyDriverUploadComplete() {
    this.addNotification('first_approver', 'New load uploaded and ready for review', 'info')
  }

  notifyFirstApprovalComplete() {
    this.addNotification('second_approver', 'Load approved by First Approver - ready for final review', 'info')
  }

  notifySecondApprovalComplete() {
    this.addNotification('invoicer', 'Load approved by Second Approver - ready for invoicing', 'info')
  }

  notifyInvoiceComplete() {
    this.addNotification('final_approver', 'Invoice generated and sent - ready for final approval', 'info')
  }

  notifyFinalApprovalComplete() {
    // Notify admin or completion
    console.log('Load processing completed!')
  }
}

export const notificationManager = NotificationManager.getInstance()
