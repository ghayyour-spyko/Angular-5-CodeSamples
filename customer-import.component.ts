import { Component, OnDestroy, OnInit } from '@angular/core';
import { Campaign } from '../../repository/campaigns/campaign';
import { Subject } from 'rxjs/Subject';
import { RepositoryResult } from '../../repository/repository-result';
import { CampaignService } from '../../repository/campaigns/campaign.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpResponse } from '@angular/common/http';
import { CustomerImportOperation } from '../customer-import-operation';
import { CustomerImportOperationService } from '../../repository/customers/customer-import-operation.service';
import { User } from '../../repository/authentication/user';
import { UserService } from '../../repository/authentication/user.service';
import 'rxjs/Rx';

@Component({
  selector: 'app-bureau-import',
  templateUrl: './customer-import.component.html'
})
export class CustomerImportComponent implements OnInit, OnDestroy {

  public fid: string;
  public campaignId: string;
  public campaign: Campaign;
  public isUploadInProgress: boolean;
  public latestImportOperation: CustomerImportOperation;
  public employee: User;
  public isOperationPending: boolean;
  public isOperationFailed: boolean;
  public isOperationCompleted: boolean;
  public isOperationProcessing: boolean;
  public isOperationCancelled: boolean;
  private ngUnsubscribe: Subject<void> = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private campaignService: CampaignService,
    private importOperationService: CustomerImportOperationService,
    private userService: UserService
  ) {
    route.parent.paramMap
      .takeUntil(this.ngUnsubscribe)
      .subscribe(p => {
        this.fid = p.get('fid');
      });

    route.paramMap
      .takeUntil(this.ngUnsubscribe)
      .subscribe(p => {
        this.campaignId = p.get('campaignId');
      });

    this.campaign = new Campaign();
    this.isUploadInProgress = false;
  }

  ngOnInit() {
    this.campaignService.getCampaign(this.fid, this.campaignId)
      .takeUntil(this.ngUnsubscribe)
      .subscribe(
        (r: HttpResponse<RepositoryResult<Campaign>>) => {
          this.campaign = r.body.data;
        }
      );

    this.importOperationService
      .getLatestOperation(this.fid, this.campaignId)
      .takeUntil(this.ngUnsubscribe)
      .subscribe(
        (r: HttpResponse<RepositoryResult<CustomerImportOperation>>) => {
          this.latestImportOperation = r.body.data;

          const status = this.latestImportOperation.status.name.toLowerCase();
          this.isOperationCancelled = status === 'cancelled';
          this.isOperationCompleted = status === 'completed';
          this.isOperationFailed = status === 'failed';
          this.isOperationPending = status === 'pending';
          this.isOperationProcessing = status === 'processing';

          if (this.latestImportOperation) {
            this.userService
              .getUserBasic(this.fid, this.latestImportOperation.employeeId)
              .takeUntil(this.ngUnsubscribe)
              .subscribe(
                (rr: HttpResponse<RepositoryResult<User>>) => {
                  this.employee = rr.body.data;
                }
              );
          }
        }
      );
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  onCustomerFileUploadStarted() {
    this.isUploadInProgress = true;
  }

  onCustomerFileUploadCompleted() {
    this.isUploadInProgress = false;
  }

  onImportOperationProcessingComplete(importOperation: CustomerImportOperation) {
    this.latestImportOperation = importOperation;
    this.userService
      .getUserBasic(this.fid, this.latestImportOperation.employeeId)
      .takeUntil(this.ngUnsubscribe)
      .subscribe(
        (rr: HttpResponse<RepositoryResult<User>>) => {
          this.employee = rr.body.data;
        }
      );
  }

  onImportOperationCreated() {
    // Reset latest import operation so if there was already an import operation
    // its status panels are removed during the new import.
    this.latestImportOperation = null;
  }

  onCustomerFileUploadFailed() {
    this.isUploadInProgress = false;
  }

  onCustomerFileProcessingRequestTimedOut() {
    this.isUploadInProgress = false;
  }

  openOperationDetails() {
    if (this.router.navigate([this.latestImportOperation.id], {relativeTo: this.route})) {
      return;
    }
  }

  goToCampaignSummary() {
    if (this.router.navigate(['../..', 'summary'], {relativeTo: this.route})) {
      return;
    }
  }
}
