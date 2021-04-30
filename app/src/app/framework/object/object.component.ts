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

import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import { ObjectService } from '../services/object.service';
import { CmdbObject } from '../models/cmdb-object';
import { RenderResult } from '../models/cmdb-render';
import { APIGetMultiResponse } from '../../services/models/api-response';
import { Column, Sort, SortDirection } from '../../layout/table/table.types';
import { CollectionParameters } from '../../services/models/api-parameter';
import { takeUntil } from 'rxjs/operators';
import { ToastService } from '../../layout/toast/toast.service';

@Component({
  selector: 'cmdb-object',
  templateUrl: './object.component.html',
  styleUrls: ['./object.component.scss']
})
export class ObjectComponent implements OnInit, OnDestroy {

  /**
   * Component un-subscriber.
   * @private
   */
  private subscriber: ReplaySubject<void>;

  /**
   * HTML ID of the table.
   */
  public readonly id: string = 'type-list-table';

  /**
   * Empty table info.
   */
  public readonly emptyTableInformation: string = 'No objects found!';

  /**
   * Default table info.
   */
  public readonly loadingTableInformation: string = 'Objects loading...';

  /**
   * Table info.
   */
  public tableInformation: string = this.emptyTableInformation;

  /**
   * Displayed objects.
   */
  public objects: Array<CmdbObject | RenderResult> = [];

  /**
   * API Response of the objects call.
   */
  public objectsAPIResponse: APIGetMultiResponse<CmdbObject | RenderResult>;

  /**
   * Total number of objects in the database.
   */
  public totalObjects: number = 0;

  /**
   * Columns at the beginning of the loading.
   */
  public initialVisibleColumns: Array<string> = [];

  /**
   * Table columns definition.
   */
  public columns: Array<Column> = [];

  /**
   * Begin with first page.
   */
  public readonly initPage: number = 1;
  public page: number = this.initPage;

  /**
   * Max number of types per site.
   * @private
   */
  private readonly initLimit: number = 25;
  public limit: number = this.initLimit;

  /**
   * Filter query from the table search input.
   */
  public filter: string;

  /**
   * Default sort filter.
   */
  public sort: Sort = { name: 'public_id', order: SortDirection.DESCENDING } as Sort;

  /**
   * Loading indicator.
   */
  public loading: boolean = false;

  /**
   * Table Template: Active column.
   */
  @ViewChild('activeTemplate', { static: true }) activeTemplate: TemplateRef<any>;

  /**
   * Table Template: Type name column.
   */
  @ViewChild('typeNameTemplate', { static: true }) typeNameTemplate: TemplateRef<any>;

  /**
   * Table Template: Type date column.
   */
  @ViewChild('dateTemplate', { static: true }) dateTemplate: TemplateRef<any>;

  /**
   * Table Template: Last edit column.
   */
  @ViewChild('lastEditTemplate', { static: true }) lastEditTemplate: TemplateRef<any>;

  /**
   * Table Template: Action column.
   */
  @ViewChild('actionTemplate', { static: true }) actionTemplate: TemplateRef<any>;

  constructor(private objectService: ObjectService<RenderResult>, private toastService: ToastService) {
    this.subscriber = new ReplaySubject<void>();
  }

  public ngOnInit(): void {
    const columns = [
      {
        display: 'Active',
        name: 'active',
        data: 'object_information.active',
        searchable: false,
        sortable: true,
        template: this.activeTemplate,
        style: { width: '6rem' }
      },
      {
        display: 'Public ID',
        name: 'public_id',
        data: 'object_information.object_id',
        searchable: true,
        sortable: true
      },
      {
        display: 'Type',
        name: 'type.name',
        data: 'type_information',
        searchable: true,
        sortable: true,
        template: this.typeNameTemplate,
      },
      {
        display: 'Summary',
        name: 'summary_line',
        data: 'summary_line',
        searchable: false,
        sortable: false
      },
      {
        display: 'Author',
        name: 'author.user_name',
        data: 'object_information.author_name',
        searchable: true,
        sortable: true
      },
      {
        display: 'Creation',
        name: 'creation_time',
        data: 'object_information.creation_time',
        searchable: true,
        sortable: true,
        template: this.dateTemplate,
      },
      {
        display: 'Last editor',
        name: 'editor.user_name',
        data: 'object_information.editor_name',
        searchable: true,
        sortable: true
      },
      {
        display: 'Last modification',
        name: 'last_edit_time',
        data: 'object_information.last_edit_time',
        searchable: true,
        sortable: true,
        template: this.lastEditTemplate,
      },
      {
        display: 'Actions',
        name: 'actions',
        data: 'object_information.object_id',
        sortable: false,
        searchable: false,
        fixed: true,
        template: this.actionTemplate,
        cssClasses: ['text-center'],
        style: { width: '6em' }
      }
    ] as Array<Column>;
    this.initialVisibleColumns = columns.filter(c => !c.hidden).map(c => c.name);
    this.columns = [... columns];
    this.loadObjectsFromAPI();
  }

  private setLoadingState(isLoading: boolean) {
    this.loading = isLoading;
    this.tableInformation = this.loading ? this.loadingTableInformation : this.emptyTableInformation;
  }

  /**
   * Load/reload objects from the api.
   * @private
   */
  private loadObjectsFromAPI(): void {
    this.setLoadingState(true);
    let query;
    if (this.filter) {
      query = [];
      const or = [];
      const searchableColumns = this.columns.filter(c => c.searchable);
      for (const column of searchableColumns) {
        const regex: any = {};
        regex[column.name] = {
          $regex: String(this.filter),
          $options: 'ismx'
        };
        or.push(regex);
      }
      query.push({
        $addFields: {
          public_id: { $toString: '$public_id' }
        }
      });
      or.push({
        public_id: {
          $elemMatch: {
            value: {
              $regex: String(this.filter),
              $options: 'ismx'
            }
          }
        }
      });
      query.push({ $match: { $or: or } });
    }
    const params: CollectionParameters = {
      filter: query, limit: this.limit,
      sort: this.sort.name, order: this.sort.order, page: this.page
    };
    this.objectService.getObjects(params).pipe(takeUntil(this.subscriber)).subscribe(
      (apiResponse: APIGetMultiResponse<RenderResult>) => {
        this.objectsAPIResponse = apiResponse;
        this.objects = apiResponse.results as Array<RenderResult>;
        this.totalObjects = apiResponse.total;
      },
      (error) => this.toastService.error(error),
      () => this.setLoadingState(false));
  }

  /**
   * On table sort change.
   * Reload all objects.
   *
   * @param sort
   */
  public onSortChange(sort: Sort): void {
    this.sort = sort;
    this.loadObjectsFromAPI();
  }

  /**
   * On table page change.
   * Reload all objects.
   *
   * @param page
   */
  public onPageChange(page: number) {
    this.page = page;
    this.loadObjectsFromAPI();
  }

  /**
   * On table page size change.
   * Reload all objects.
   *
   * @param limit
   */
  public onPageSizeChange(limit: number): void {
    this.limit = limit;
    this.page = this.initPage;
    this.loadObjectsFromAPI();
  }


  /**
   * On table search change.
   * Reload all objects.
   *
   * @param search
   */
  public onSearchChange(search: any): void {
    if (search) {
      this.filter = search;
    } else {
      this.filter = undefined;
    }
    this.loadObjectsFromAPI();
  }

  /**
   * On delete object call.
   * @param objectID
   */
  public onObjectDelete(objectID: number) {
    this.objectService.deleteObject(objectID).pipe(takeUntil(this.subscriber))
      .subscribe(() => {
          this.toastService.success(`Object ${ objectID } was deleted successfully`);
          this.loadObjectsFromAPI();
        },
        (error) => {
          this.toastService.error(`Error while deleting object ${ objectID } | Error: ${ error }`);
        });
  }

  /**
   * Destroy subscriptions after closed.
   */
  public ngOnDestroy(): void {
    this.subscriber.next();
    this.subscriber.complete();
  }

}
