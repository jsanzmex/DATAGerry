/*
* DATAGERRY - OpenSource Enterprise CMDB
* Copyright (C) 2024 becon GmbH
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
*
* You should have received a copy of the GNU Affero General Public License
* along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { InfoRoutingModule } from './info-routing.module';
import { LayoutModule } from '../layout/layout.module';

import { AboutComponent } from './components/about/about.component';
import { LicenseComponent } from './components/license/license.component';
import { InfoComponent } from './info.component';
/* ------------------------------------------------------------------------------------------------------------------ */

@NgModule({
    declarations: [
        AboutComponent,
        LicenseComponent,
        InfoComponent
    ],
    imports: [
        CommonModule,
        LayoutModule,
        InfoRoutingModule,
        FontAwesomeModule
    ]
})
export class InfoModule {
}
