import { DeviceDetectorService } from 'ngx-device-detector';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DeviceUtils {

  showAllChats = true;

  constructor(private deviceService: DeviceDetectorService) { }

  get isMobile(): boolean {
    return this.deviceService.isMobile();
  }

}
