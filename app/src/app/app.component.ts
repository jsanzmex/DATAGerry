/*
* DATAGERRY - OpenSource Enterprise CMDB
* Copyright (C) 2019 NETHINKS GmbH
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
* along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { Component, OnInit, ViewChild } from '@angular/core';
import { AuthService } from './auth/services/auth.service';
import { ActivatedRoute, ActivationStart, Event, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { NavigationComponent } from './layout/structure/navigation/navigation.component';

declare type AppView = 'full' | 'embedded';


@Component({
  selector: 'cmdb-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  public readonly defaultView: AppView = 'full';
  public view: AppView;
  public initDone: boolean = false;

  constructor(private router: Router, private route: ActivatedRoute) {
    this.view = this.defaultView;
  }

  public ngOnInit(): void {
    this.router.events.subscribe((e: Event) => {
      if (e instanceof NavigationEnd) {
        this.route.url.subscribe(() => {
          if (this.route.snapshot.firstChild.data.view) {
            this.view = this.route.snapshot.firstChild.data.view;
          } else {
            this.view = this.defaultView;
          }
          this.initDone = true;
        });
      }
    });
  }

}
