import { DeviceUtils } from './../../services/device.service';
import { UserService } from './../../services/user.service';
import { Component } from '@angular/core';
import { DeviceDetectorService } from 'ngx-device-detector';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {

  constructor(public user: UserService, public deviceService: DeviceDetectorService, public deviceUtils: DeviceUtils) { }

  ngOnInit(): void {
    console.log(this.deviceService.isMobile());
  }

  taxChanged(index: number): void {
    this.deviceUtils.showAllChats = index === 0;
  }

}
