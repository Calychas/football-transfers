import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';

@Component({
  selector: 'app-network-details',
  templateUrl: './network-details.component.html',
  styleUrls: ['./network-details.component.scss']
})
export class NetworkDetailsComponent {
  private _selectedElement

  get selectedElement(): any {
    return this._selectedElement
  }

  @Input()
  set selectedElement(val: any) {
    this._selectedElement = val
    if (val) {
      this._selectedElement = Object.entries(val.data())
    }
  }

  // ngOnChanges(changes: SimpleChanges): void {
  //   if (changes.selectedElement.currentValue) {
  //     console.log(changes.selectedElement.currentValue.data())
  //   }
  // }
}
