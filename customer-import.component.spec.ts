import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerImportComponent } from './customer-import.component';
import { CustomerImportUploaderComponent } from '../customer-import-uploader/customer-import-uploader.component';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { CampaignService } from '../../repository/campaigns/campaign.service';
import { Campaign } from '../../repository/campaigns/campaign';
import { RepositoryResult } from '../../repository/repository-result';
import { Status } from '../../repository/campaigns/status';
import { ProgressbarModule, TooltipModule } from 'ngx-bootstrap';
import { CustomerImportOperationService } from '../../repository/customers/customer-import-operation.service';
import { TransitionIndicatorComponent } from '../../widget.module/progressbars.module/transition-indicator/transition-indicator.component';
import { RouterTestingModule } from '@angular/router/testing';
import { CustomerImportOperation } from '../customer-import-operation';
import { UserService } from '../../repository/authentication/user.service';
import { CustomerImportOperationStatus } from '../customer-import-operation-status';
import { User } from '../../repository/authentication/user';


/**
 * Page contains references to DOM elements so tests can perform queries
 * and tests directly against them.
 */
class Page {
  campaignService: CampaignService;
  campaignServiceSpies = {
    getCampaign: null
  };

  importOperationService: CustomerImportOperationService;
  importOperationServiceSpies = {
    getLatestOperation: null
  };

  userService: UserService;
  userServiceSpies = {
    getUserBasic: null
  };

  constructor(fixture: ComponentFixture<CustomerImportComponent>) {
    this.campaignService = fixture.debugElement.injector.get(CampaignService);
    this.campaignServiceSpies.getCampaign = spyOn(this.campaignService, 'getCampaign');

    this.importOperationService = fixture.debugElement.injector.get(CustomerImportOperationService);
    this.importOperationServiceSpies.getLatestOperation = spyOn(this.importOperationService, 'getLatestOperation');

    this.userService = fixture.debugElement.injector.get(UserService);
    this.userServiceSpies.getUserBasic = spyOn(this.userService, 'getUserBasic');
  }
}



describe('CustomerImportComponent', () => {
  let component: CustomerImportComponent;
  let fixture: ComponentFixture<CustomerImportComponent>;
  let page: Page;

  const campaignStatusesForTest: Status[] = [
    new Status(<Status>{id: 'draft', name: 'Draft'}),
    new Status(<Status>{id: 'under review', name: 'Under Review'}),
    new Status(<Status>{id: 'approved', name: 'Approved'}),
    new Status(<Status>{id: 'live', name: 'Live'}),
    new Status(<Status>{id: 'paused', name: 'Paused'}),
    new Status(<Status>{id: 'completed', name: 'Completed'}),
    new Status(<Status>{id: 'abandoned', name: 'Abandoned'}),
    new Status(<Status>{id: 'stopped', name: 'Stopped'})
  ];

  const operationStatusesForTest: CustomerImportOperationStatus[] = [
    new CustomerImportOperationStatus({id: 'pending', name: 'Pending'} as CustomerImportOperationStatus),
    new CustomerImportOperationStatus({id: 'processing', name: 'Processing'} as CustomerImportOperationStatus),
    new CustomerImportOperationStatus({id: 'failed', name: 'Failed'} as CustomerImportOperationStatus),
    new CustomerImportOperationStatus({id: 'completed', name: 'Completed'} as CustomerImportOperationStatus),
    new CustomerImportOperationStatus({id: 'cancelled', name: 'Cancelled'} as CustomerImportOperationStatus)
  ];

  const draftCampaignForTest = makeTestCampaign(campaignStatusesForTest.find(s => s.isDraft()));

  function makeTestCampaign(status: Status) {
    return new Campaign({
      timeZone: 'east coast',
      id: 'campaign_id_123',
      name: 'jasmine test campaign',
      status: status,
      startDate: '2017-09-01T00:00:00',
      endDate: '2017-10-01T00:00:00'
    });
  }

  beforeEach(async(() => {
    const activatedRouteStub = {
      parent: {
        paramMap: Observable.of(convertToParamMap({
          fid: '91d7b01b-68f8-4129-9bea-8648b9544ee1'
        }))
      },
      paramMap: Observable.of(convertToParamMap({
        campaignId: 'camp_123'
      }))
    };

    TestBed.configureTestingModule({
      declarations: [
        CustomerImportComponent,
        CustomerImportUploaderComponent,
        TransitionIndicatorComponent
      ],
      providers: [
        {provide: CampaignService, useValue: new CampaignService({} as HttpClient)},
        {provide: ActivatedRoute, useValue: activatedRouteStub},
        {provide: UserService, useValue: new UserService({} as HttpClient)},
        {provide: CustomerImportOperationService, useValue: new CustomerImportOperationService({} as HttpClient)}
      ],
      imports: [
        ProgressbarModule.forRoot(),
        TooltipModule.forRoot(),
        RouterTestingModule
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomerImportComponent);
    component = fixture.componentInstance;
    page = new Page(fixture);

    page.campaignServiceSpies.getCampaign.and.returnValue(
      Observable.of(new HttpResponse<RepositoryResult<Campaign>>({
        body: new RepositoryResult<Campaign>({
          data: draftCampaignForTest
        })
      }))
    );

    page.importOperationServiceSpies.getLatestOperation.and.returnValue(
      Observable.of(new HttpResponse<RepositoryResult<CustomerImportOperation>>({
        body: new RepositoryResult<CustomerImportOperation>({
          data: new CustomerImportOperation(<CustomerImportOperation>{
            status: operationStatusesForTest.find(s => s.id === 'pending')
          })
        })
      }))
    );

    page.userServiceSpies.getUserBasic.and.returnValue(
      Observable.of(new HttpResponse<User>({
        body: new User()
      }))
    );

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
