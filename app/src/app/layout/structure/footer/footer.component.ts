/*
* DATAGERRY - OpenSource Enterprise CMDB
* Copyright (C) 2019 - 2021 NETHINKS GmbH
*
* This program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as
* published by the Free Software Foundation, either version 3 of the
* License, or (at your option) any later version.
*
* This program is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Affero General Public License for more details.

* You should have received a copy of the GNU Affero General Public License
* along with this program. If not, see <https://www.gnu.org/licenses/>.
*/

import { Component, OnDestroy, OnInit } from '@angular/core';
import { ConnectionService } from '../../../connect/connection.service';
import { SessionTimeoutService } from '../../../auth/services/session-timeout.service';
import { ReplaySubject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'cmdb-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit, OnDestroy {

  private subscriber: ReplaySubject<void> = new ReplaySubject<void>();

  public today: number = Date.now();
  public docUrl: string = 'localhost';
  public timeout: string = '';

  public constructor(private connectionService: ConnectionService, private timeoutService: SessionTimeoutService) {
    this.docUrl = `${ connectionService.currentConnection }/docs`;
  }


  public ngOnInit(): void {
    this.timeoutService.sessionTimeoutRemaining.asObservable().pipe(takeUntil(this.subscriber)).subscribe((timeout: string) => {
      this.timeout = timeout;
    });
  }

  public ngOnDestroy(): void {
    this.subscriber.next();
    this.subscriber.complete();
  }

}





