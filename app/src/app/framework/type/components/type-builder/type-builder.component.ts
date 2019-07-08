/*
* dataGerry - OpenSource Enterprise CMDB
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

import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { TypeBasicStepComponent } from './type-basic-step/type-basic-step.component';
import { CmdbType } from '../../../models/cmdb-type';
import { TypeFieldsStepComponent } from './type-fields-step/type-fields-step.component';
import { TypeMetaStepComponent } from './type-meta-step/type-meta-step.component';
import { TypeAccessStepComponent } from './type-access-step/type-access-step.component';
import { TypeService } from '../../../services/type.service';
import { UserService } from '../../../../user/services/user.service';
import { User } from '../../../../user/models/user';
import { CategoryService } from '../../../services/category.service';
import { Modes } from '../../builder/modes.enum';
import { Router } from '@angular/router';


@Component({
  selector: 'cmdb-type-builder',
  templateUrl: './type-builder.component.html',
  styleUrls: ['./type-builder.component.scss']
})
export class TypeBuilderComponent implements OnInit {


  @Input() private typeInstance?: CmdbType;
  @Input() private mode: number = Modes.Create;

  @ViewChild(TypeBasicStepComponent, {static: true})
  private basicStep: TypeBasicStepComponent;

  @ViewChild(TypeFieldsStepComponent, {static: true})
  private fieldStep: TypeFieldsStepComponent;

  @ViewChild(TypeMetaStepComponent, {static: true})
  private metaStep: TypeMetaStepComponent;

  @ViewChild(TypeAccessStepComponent, {static: true})
  private accessStep: TypeAccessStepComponent;

  private selectedCategoryID: number = 0;

  public constructor(private router: Router, private typeService: TypeService, private userService: UserService, private categoryService: CategoryService) {
  }

  public ngOnInit(): void {
    this.typeInstance = new CmdbType();
    this.typeInstance.version = '1.0.0';
    this.userService.getCurrentUser().subscribe((currentUser: User) => {
      this.typeInstance.author_id = currentUser.public_id;
    });
  }

  private exitBasicStep() {
    this.selectedCategoryID = this.basicStep.basicCategoryForm.value.category_id;
    this.assignToType(this.basicStep.basicForm.value);
  }

  private exitFieldStep() {
    let fieldBuffer = [];
    let sectionBuffer = [];
    const sectionOrigin = this.fieldStep.typeBuilder.sections;
    for (const section of sectionOrigin) {
      const sectionGlobe = Object.assign({}, section);
      fieldBuffer = fieldBuffer.concat(sectionGlobe.fields);
      const sectionFieldNames = new Set(sectionGlobe.fields.map(f => f.name));
      delete sectionGlobe.fields;

      sectionGlobe.fields = Array.from(sectionFieldNames);

      sectionBuffer = sectionBuffer.concat(sectionGlobe);
    }
    this.assignToType({fields: fieldBuffer});
    this.assignToType({sections: sectionBuffer}, 'render_meta');
  }

  private exitMetaStep() {
    this.assignToType({summary: this.metaStep.summariesSections}, 'render_meta');
    this.assignToType({external: this.metaStep.externalLinks}, 'render_meta');
  }

  private exitAccessStep() {
    this.assignToType(this.accessStep.accessForm.value, 'access');
  }

  private saveType() {
    let newTypeID = null;
    this.typeService.postType(this.typeInstance).subscribe(typeIDResp => {
        newTypeID = typeIDResp;
        if (this.selectedCategoryID !== null) {
          this.categoryService.addTypeToCategory(this.selectedCategoryID, newTypeID);
        }
      },
      (error) => {

      },
      () => {
        this.router.navigate(['/framework/type/'], {queryParams: {typeAddSuccess: newTypeID}});
      });

  }

  public assignToType(data: any, optional: any = null) {
    if (optional !== null) {
      if (this.typeInstance[optional] === undefined) {
        this.typeInstance[optional] = {};
      }
      Object.assign(this.typeInstance[optional], data);
    } else {
      Object.assign(this.typeInstance, data);
    }
  }

}
