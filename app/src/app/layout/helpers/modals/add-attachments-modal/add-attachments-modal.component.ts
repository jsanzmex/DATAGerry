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

import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FileSaverService } from 'ngx-filesaver';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastService } from '../../../toast/toast.service';
import { GeneralModalComponent } from '../general-modal/general-modal.component';
import { CollectionParameters } from '../../../../services/models/api-parameter';
import { InfiniteScrollService } from '../../../services/infinite-scroll.service';
import { APIGetMultiResponse } from '../../../../services/models/api-response';
import { takeUntil} from 'rxjs/operators';
import { ReplaySubject } from 'rxjs';
import { FileMetadata } from '../../../components/file-explorer/model/metadata';
import { FileElement } from '../../../components/file-explorer/model/file-element';
import { FileService } from '../../../components/file-explorer/service/file.service';

@Component({
  selector: 'cmdb-add-attachments-modal',
  templateUrl: './add-attachments-modal.component.html',
  styleUrls: ['./add-attachments-modal.component.scss']
})
export class AddAttachmentsModalComponent implements OnInit, OnDestroy {

  /**
   * Global unsubscriber for http calls to the rest backend.
   */
  private unSubscribe: ReplaySubject<void> = new ReplaySubject();

  @Input() metadata: FileMetadata = new FileMetadata();
  public inProcess: boolean = false;
  public attachments: FileElement[] = [];
  public recordsTotal: number = 0;
  private dataMaxSize: number = 1024 * 1024 * 50;
  private readonly defaultApiParameter: CollectionParameters = {page: 1, limit: 100, order: 1};


  constructor(private fileService: FileService, private fileSaverService: FileSaverService,
              private modalService: NgbModal, public activeModal: NgbActiveModal, private toast: ToastService,
              private scrollService: InfiniteScrollService) { }

  public ngOnInit(): void {
    this.fileService.getAllFilesList(this.metadata).subscribe((data: APIGetMultiResponse<FileElement>) => {
      this.attachments.push(...data.results);
      this.recordsTotal = data.total;
    });
  }

  /**
   * Get all attachments as a list
   * As you scroll, new records are added to the attachments.
   * Without the scrolling parameter the attachments are reinitialized
   * @param apiParameters Instance of {@link CollectionParameters}
   * @param onScroll Control if it is a new file upload
   */
  public getFiles(apiParameters?: CollectionParameters, onScroll: boolean = false): void {
    this.fileService.getAllFilesList(this.metadata, apiParameters ? apiParameters : this.defaultApiParameter)
      .subscribe((data: APIGetMultiResponse<FileElement>) => {
        if (onScroll) {
          this.attachments.push(...data.results);
        } else {
          this.attachments = data.results;
        }
        this.recordsTotal = data.total;
        this.inProcess = false;
      });
  }

  /**
   * Upload selected file from File Browser
   * @param files selected file
   */
  public uploadFile(files: FileList) {
    if (files.length > 0) {
      Array.from(files).forEach((file: any) => {
        if (this.checkFileSizeAllow(file)) {
          this.checkFileExist(file.name).then(exist => {
            if (exist) {
              const promiseModal = this.replaceFileModal(file.name).then(result => {
                if (result) {
                  this.attachments.push(...this.attachments.filter(el => el.filename !== file.name));
                  return true;
                } else {return false; }
              });
              promiseModal.then(value => {
                if (value) {this.postFile(file); }
              });
            } else { this.postFile(file); }
          });
        }
      });
    }
  }

  /**
   * Checks if the file already exists in the database
   * @param value filename
   */
  private checkFileExist(value) {
    return new Promise((resolve) => {
      this.fileService.getFileElement(value, this.metadata).pipe(
        takeUntil(this.unSubscribe)).subscribe(
        () => resolve(true),
        () => resolve(false)
      );
    });
  }

  /**
   * Check if the upload file is larger than 50 M/Bytes.
   * @param file: File to be uploaded
   * @return boolean: false if larger than 50 M/Bytes, else true
   */
  private checkFileSizeAllow(file: File): boolean {
    const maxSize = this.dataMaxSize;
    if ( file.size > maxSize ) {
      this.toast.error(`File size is more then 50 M/Bytes.`);
      return false;
    }
    return true;
  }

  /**
   * Update selected file
   * @param file current file for update
   */
  private postFile(file: any) {
    file.inProcess = true;
    this.inProcess = true;
    this.attachments = [file].concat(this.attachments);
    this.fileService.postFile(file, this.metadata).subscribe(() => {
      this.getFiles(this.defaultApiParameter);
    }, (err) => console.log(err));
  }

  private replaceFileModal(filename: string) {
    const modalComponent = this.modalService.open(GeneralModalComponent);
    modalComponent.componentInstance.title = `Replace ${filename}`;
    modalComponent.componentInstance.modalIcon = 'question-circle';
    modalComponent.componentInstance.modalMessage = `${filename} already exists. Do you want to replace it?`;
    modalComponent.componentInstance.subModalMessage = `A file with the same name already exists on this Object.
                                                        Replace it will overwrite its current contents`;
    modalComponent.componentInstance.buttonDeny = 'Cancel';
    modalComponent.componentInstance.buttonAccept = 'Replace';
    return modalComponent.result;
  }

  public ngOnDestroy(): void {
    this.unSubscribe.next();
    this.unSubscribe.complete();
  }

}
