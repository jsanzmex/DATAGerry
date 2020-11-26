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

import {Component, Input, OnInit} from '@angular/core';
import { CmdbCategoryNode } from '../../../framework/models/cmdb-category';
import {UserService} from '../../../management/services/user.service';
import {AccessControlPermission} from '../../../acl/acl.types';

@Component({
  selector: 'cmdb-sidebar-category',
  templateUrl: './sidebar-category.component.html',
  styleUrls: ['./sidebar-category.component.scss'],
})
export class SidebarCategoryComponent implements OnInit {

  @Input() categoryNode: CmdbCategoryNode;

  constructor(private userService: UserService) {
  }

  ngOnInit(): void {
    const group_id = this.userService.getCurrentUser().group_id;
    this.categoryNode.types = this.categoryNode.types.filter(type => !type.acl.activated ||
      ( type.acl.groups.includes[group_id] && 'READ' in (type.acl.groups.includes[group_id] as any[])));
  }


}
