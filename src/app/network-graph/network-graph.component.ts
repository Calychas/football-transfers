import {AfterViewInit, Component, ElementRef, EventEmitter, OnInit, Output, ViewChild} from '@angular/core';
import cytoscape from 'cytoscape';
import cola from 'cytoscape-cola'
import euler from 'cytoscape-euler'
import d3Force from 'cytoscape-d3-force'
import fcose from 'cytoscape-fcose'
import avsdf from 'cytoscape-avsdf'
import viewUtilities from 'cytoscape-view-utilities'
import * as dataforge from 'data-forge'
import { HttpClient } from "@angular/common/http";
import {forkJoin, pipe} from "rxjs";

cytoscape.use( cola )
cytoscape.use( d3Force )
cytoscape.use( euler )
cytoscape.use( fcose )
cytoscape.use( avsdf )
cytoscape.use( viewUtilities )

@Component({
  selector: 'app-network-graph',
  templateUrl: './network-graph.component.html',
  styleUrls: ['./network-graph.component.scss']
})
export class NetworkGraphComponent implements AfterViewInit {
  @ViewChild('cycontainer', {static: false}) cyContainer: ElementRef
  private cy
  private nodes_major
  private edges_major
  private api
  public isLoading: boolean = true
  public sliderEnabled: boolean = false
  public sliderValue: number = 2019
  @Output() selectedElement = new EventEmitter()

  // https://github.com/iVis-at-Bilkent/cytoscape.js-fcose
  public fcoseLayout = {
    name: 'fcose',
    quality: "proof",
    randomize: false,
    nodeRepulsion: 200000,
    idealEdgeLength: 600,
    numIter: 5000,
    nodeSeparation: 1000,
    nodeDimensionsIncludeLabels: true,
    ready: () => {
      this.isLoading = true
    },
    stop: () => {
      this.isLoading = false
    }
  }

  public gridLayout = {
    name: 'grid',
    avoidOverlapPadding: 100,
    ready: () => {
      this.isLoading = true
    },
    stop: () => {
      this.isLoading = false
    },
    sort: (a,b) => ((a.data('country') > b.data('country')) ? 1 : (a.data('country') < b.data('country')) ? -1 : (b.data('size') - a.data('size')))
  }

  public circleLayout = {
    name: 'circle',
    ready: () => {
      this.isLoading = true
    },
    stop: () => {
      this.isLoading = false
    },
    sort: (a,b) => (a.data('country') > b.data('country') ? 1 : -1)
  }

  public concentricLayout = {
    name: 'concentric',
    // concentric: function( node ){
    //   return node.degree();
    // },
    // levelWidth: function( nodes ){
    //   return 15;
    // },
    // nodeDimensionsIncludeLabels: true,
    minNodeSpacing: 70,
    ready: () => {
      this.isLoading = true
    },
    stop: () => {
      this.isLoading = false
    }
  }

  public layoutSettings = this.concentricLayout

  constructor(private http: HttpClient) { }

  getColorBasedOnLeague(leagueName: string): string {
    switch (leagueName) {
      case "serie-a":
        return "#00af87"
      case "premier-liga":
        return "#fa9200"
      case "premier-league":
        return "#806b68"
      case "laliga":
        return "#69c404"
      case "ligue-1":
        return "#ff5d85"
      case "1-bundesliga":
        return "#00c7ff"
      default:
        throw new Error()
    }
  }

  readDataAndCreateNetwork() {
    let data$ = forkJoin({
      nodes: this.http.get('assets/nodes_major.csv', {responseType: 'text'}),
      edges: this.http.get('assets/edges_major.csv', {responseType: 'text'})
    }).subscribe(value => {
      let {nodes, edges} = value
      this.nodes_major = JSON.parse(dataforge.fromCSV(nodes).toJSON()).map(n => {
        n["color"] = this.getColorBasedOnLeague(n.group)
        n["size"] = +n["Degree"]
        n["year"] = +n["year"]
        return {data: n}
      })

      this.edges_major = JSON.parse(dataforge.fromCSV(edges).toJSON()).map(e => {
        let source_node = this.nodes_major.find(n => n.data.id === e.source).data
        let target_node = this.nodes_major.find(n => n.data.id === e.target).data
        e["color"] = source_node.color
        e["source_label"] = source_node.Label
        e["target_label"] = target_node.Label
        e["year"] = +e["year"]
        return {data: e}
      })
      this.createNetwork()
      this.addDataToNetwork()
      this.setLayout(this.layoutSettings)
      this.setActions()
    })
  }

  ngAfterViewInit(): void {
    this.readDataAndCreateNetwork()
  }

  createNetwork(): void {
    let container = this.cyContainer.nativeElement
    let style = [ // the stylesheet for the graph
      {
        selector: 'node',
        style: {
          'background-color': 'data(color)',
          'label': 'data(Label)',
          'width': 'mapData(size, 0, 255, 20, 50)',
          'height': 'mapData(size, 0, 255, 20, 50)'
        }
      },

      {
        selector: 'edge',
        style: {
          'width': 1,
          'line-color': 'data(color)',
          'target-arrow-color': 'data(color)',
          'target-arrow-shape': 'triangle',
          'opacity': 0.5,
          'curve-style': 'bezier'
        }
      },
      {
        selector: 'node:selected',
        style: {
          'border-color': 'black',
          'border-width': '3px',
        }
      },
      {
        selector: 'edge:selected',
        style: {
          'line-color': 'black',
          'target-arrow-color': 'black',
          'opacity': 1,
          'label': 'data(Label)',
        }
      },
    ]

    this.cy = cytoscape({
      container: container,
      style: style,
      pixelRatio: 1,
      hideEdgesOnViewport: true,
      // textureOnViewport: true
    });

    this.api = this.cy.viewUtilities({
      highlightStyles: [
        {
          node: {
            'border-color': 'red',
            'border-width': '3px',
          },
          edge: {
            'line-color': 'black',
            'target-arrow-color': 'black',
            'opacity': 1,
            'width': 2,
          }
        },
      ],
      selectStyles: {
        // node: {'border-color': 'black', 'border-width': 3, 'background-color': 'lightgrey'},
        // edge: {'line-color': 'black', 'source-arrow-color': 'black', 'target-arrow-color': 'black', 'width' : 3}
      },
      setVisibilityOnHide: false, // whether to set visibility on hide/show
      setDisplayOnHide: true, // whether to set display on hide/show
      zoomAnimationDuration: 500, //default duration for zoom animation speed
      neighbor: function(node){
        return node.neighborhood();
      },
      neighborSelectTime: 100
    })
  }

  addDataToNetwork() {
    this.cy.add(this.nodes_major)
    this.cy.add(this.edges_major)
  }

  setLayout(layoutSettings) {
    let layout = this.cy.layout(layoutSettings);
    layout.run()
  }

  setActions() {
    this.cy.on('click', 'node',  evt => {
      this.api.removeHighlights();
      this.api.highlightNeighbors(evt.target, 0);
      this.selectedElement.emit(evt.target)
    })
    this.cy.on('click', 'edge',  evt => {
      this.api.removeHighlights();
      this.selectedElement.emit(evt.target)
    })
    this.cy.on('tap', evt => {
      if (evt.target === this.cy) {
        this.api.removeHighlights();
        this.selectedElement.emit(null)
      }
    })
  }

  onTimelineToggle($event: any) {
    this.sliderEnabled = $event
    if (this.sliderEnabled) {
      this.onSliderChange(this.sliderValue)
    } else {
      this.api.show(this.cy.elements())
    }
  }

  onSliderChange($event: any) {
    this.sliderValue = $event
    this.api.hide(this.cy.edges())
    let edges_in_year = this.cy.filter(`edge[year=${this.sliderValue}]`)
    this.api.show(edges_in_year)
  }
}
