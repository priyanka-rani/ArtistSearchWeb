// ✅ notification.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'danger';
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  private idCounter = 0;

  show(message: string, type: 'success' | 'danger') {
    const notification: Notification = {
      id: ++this.idCounter,
      message,
      type
    };

    const current = this.notificationsSubject.value;
    this.notificationsSubject.next([...current, notification]);

    setTimeout(() => this.remove(notification.id), 3000);
  }

  remove(id: number) {
    const updated = this.notificationsSubject.value.filter(n => n.id !== id);
    this.notificationsSubject.next(updated);
  }
}
