import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {NetworkGraphComponent} from "./network-graph/network-graph.component";


const routes: Routes = [
  { path: '**', component: NetworkGraphComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
