import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import cytoscape from 'cytoscape';
import * as dataforge from 'data-forge'
import { HttpClient } from "@angular/common/http";

@Component({
  selector: 'app-network-graph',
  templateUrl: './network-graph.component.html',
  styleUrls: ['./network-graph.component.scss']
})
export class NetworkGraphComponent implements OnInit, AfterViewInit {
  @ViewChild('cycontainer', {static: false}) cyContainer: ElementRef
  private cy
  private nodesFile

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.readData()
  }

  readData() {
    this.http.get('assets/nodes.csv', {responseType: 'text'})
      .subscribe(data => {
        this.nodesFile = dataforge.fromCSV(data)
        this.nodesFile.
        console.log(this.nodesFile)
      });
  }

  ngAfterViewInit(): void {
    // this.createNetwork()
  }

  createNetwork(): void {
    this.cy = cytoscape({

      container: this.cyContainer.nativeElement, // container to render in

      elements: [ // list of graph elements to start with
        { // node a
          data: { id: 'a' }
        },
        { // node b
          data: { id: 'b' }
        },
        { // edge ab
          data: { id: 'ab', source: 'a', target: 'b' }
        }
      ],

      style: [ // the stylesheet for the graph
        {
          selector: 'node',
          style: {
            'background-color': '#666',
            'label': 'data(id)'
          }
        },

        {
          selector: 'edge',
          style: {
            'width': 3,
            'line-color': '#ccc',
            'target-arrow-color': '#ccc',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier'
          }
        }
      ],

      layout: {
        name: 'grid',
        rows: 1
      }

    });
  }

}
