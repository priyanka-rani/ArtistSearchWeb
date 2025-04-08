import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../notification.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css']
})
export class NotificationComponent {
  notifications$!: Observable<any[]>;

  constructor(private notificationService: NotificationService) {
    this.notifications$ = this.notificationService.notifications$;
  }

  remove(index: number) {
    this.notificationService.remove(index);
  }
}