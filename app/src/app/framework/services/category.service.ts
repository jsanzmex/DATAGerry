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

import { Injectable } from '@angular/core';
import { catchError, map, switchMap } from 'rxjs/operators';
import {
  ApiCallService,
  ApiService,
  httpObserveOptions,
  HttpProtocolHelper,
} from '../../services/api-call.service';
import { ValidatorService } from '../../services/validator.service';
import { CmdbCategory, CmdbCategoryNode, CmdbCategoryTree } from '../models/cmdb-category';
import { FormControl } from '@angular/forms';
import { Observable, timer } from 'rxjs';
import { HttpParams, HttpResponse } from '@angular/common/http';
import {
  APIDeleteSingleResponse,
  APIGetMultiResponse,
  APIGetSingleResponse,
  APIInsertSingleResponse,
  APIUpdateSingleResponse
} from '../../services/models/api-response';
import { CollectionParameters } from '../../services/models/api-parameter';

export const checkCategoryExistsValidator = (categoryService: CategoryService, time: number = 500) => {
  return (control: FormControl) => {
    return timer(time).pipe(switchMap(() => {
      return categoryService.getCategoryByName(control.value).pipe(
        map((response) => {
          if (response === null) {
            return null;
          } else {
            return { categoryExists: true };
          }
        }),
        catchError(() => {
          return new Promise(resolve => {
            resolve(null);
          });
        })
      );
    }));
  };
};

@Injectable({
  providedIn: 'root'
})
export class CategoryService<T = CmdbCategory> implements ApiService {

  /**
   * Nested url path value inside the REST structure
   */
  public servicePrefix: string = 'categories';

  constructor(private api: ApiCallService) {

  }

  public getCategories(params: CollectionParameters = {
    filter: undefined,
    limit: 10,
    sort: 'public_id',
    order: 1,
    page: 1
  }): Observable<APIGetMultiResponse<T>> {
    const options = httpObserveOptions;
    let httpParams: HttpParams = new HttpParams();
    if (params.filter !== undefined) {
      const filter = JSON.stringify(params.filter);
      httpParams = httpParams.set('filter', filter);
    }
    httpParams = httpParams.set('limit', params.limit.toString());
    httpParams = httpParams.set('sort', params.sort);
    httpParams = httpParams.set('order', params.order.toString());
    httpParams = httpParams.set('page', params.page.toString());
    options.params = httpParams;
    return this.api.callGet<T[]>(this.servicePrefix + '/', options).pipe(
      map((apiResponse: HttpResponse<APIGetMultiResponse<T>>) => {
        return apiResponse.body;
      })
    );
  }

  /**
   * Get a category by id
   */
  public getCategory(publicID: number): Observable<T> | undefined {
    const options = httpObserveOptions;
    options.params = new HttpParams();
    return this.api.callGet<T>(this.servicePrefix + '/' + publicID, options).pipe(
      map((apiResponse: HttpResponse<APIGetSingleResponse<T>>) => {
        if (apiResponse.status === 204) {
          return undefined;
        }
        return apiResponse.body.result;
      })
    );
  }

  /**
   * Get a category by name
   * @param category name or label of the category
   */
  public getCategoryByName(category: string): Observable<T | null> {
    const params = encodeURIComponent(`{"name": "${ category }"}`);
    return this.api.callGet<T>(this.servicePrefix + `/?filter=` + params).pipe(
      map((apiResponse: HttpResponse<APIGetMultiResponse<T>>) => {
        if (apiResponse.body.count === 0) {
          return null;
        } else {
          return apiResponse.body.results[0];
        }
      })
    );
  }


  /**
   * Get a list of categories by a regex requirement
   * Works with name and label
   * @param regex parameter
   */
  public getCategoriesByName(regex: string): Observable<T[]> {
    regex = ValidatorService.validateRegex(regex).trim();
    const filter = {
      $or: [{ name: { $regex: regex, $options: 'ismx' } }, { label: { $regex: regex, $options: 'ismx' } }]
    };
    const options = HttpProtocolHelper.createHttpProtocolOptions(httpObserveOptions, JSON.stringify(filter), 0);
    return this.api.callGet<T[]>(this.servicePrefix + '/', options).pipe(
      map((apiResponse: HttpResponse<APIGetMultiResponse<T>>) => {
        if (apiResponse.body.count === 0) {
          return null;
        } else {
          return apiResponse.body.results;
        }
      })
    );
  }


  /**
   * Get the complete category tree with
   * nested structure and type instances
   */
  public getCategoryTree(): Observable<CmdbCategoryTree> {
    const httpProtocol = httpObserveOptions;
    httpProtocol.params = new HttpParams().append('view', 'tree');

    return this.api.callGet<CmdbCategoryTree>(`${ this.servicePrefix }/`, httpProtocol).pipe(
      map((apiResponse: HttpResponse<APIGetMultiResponse<CmdbCategoryNode>>) => {
        if (apiResponse.status === 204) {
          return [];
        }
        return apiResponse.body.results as CmdbCategoryTree;
      })
    );
  }

  /**
   * Add a new unique category into the database
   * @param category raw instance of a CategoryDAO
   */
  public postCategory(category: T): Observable<T> {
    const options = httpObserveOptions;
    options.params = new HttpParams();
    return this.api.callPost<CmdbCategory>(this.servicePrefix + '/', category, options).pipe(
      map((apiResponse: HttpResponse<APIInsertSingleResponse<T>>) => {
        if (apiResponse.status === 204) {
          return null;
        }
        return apiResponse.body.raw;
      })
    );
  }

  /**APIUpdateSingleResponse
   * Update a existing categoryL
   * @param category modified category instance
   */
  public updateCategory(category: T): Observable<T> {
    const options = httpObserveOptions;
    options.params = new HttpParams();
    // @ts-ignore
    return this.api.callPut<number>(this.servicePrefix + '/' + category.public_id, category, options).pipe(
      map((apiResponse: HttpResponse<APIUpdateSingleResponse<T>>) => {
        return apiResponse.body.result;
      })
    );
  }


  /**
   * Delete a existing category
   * @param publicID the category id
   */
  public deleteCategory(publicID: number): Observable<number> {
    const options = httpObserveOptions;
    options.params = new HttpParams();
    return this.api.callDelete<number>(this.servicePrefix + '/' + publicID, options).pipe(
      map((apiResponse: HttpResponse<APIDeleteSingleResponse<CmdbCategory>>) => {
        return apiResponse.body.raw.public_id;
      })
    );
  }

}
