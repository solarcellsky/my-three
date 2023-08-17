import type { Map, CustomLayerInterface } from 'mapbox-gl';
import Stats from "three/examples/jsm/libs/stats.module.js";

let stats: {
  dom: any; update: () => void;
};
function animate() {
  requestAnimationFrame(animate);
  stats.update();
}

export class ThreeBoxCustomLayer implements CustomLayerInterface {
  public id: string;
  public type = 'custom' as const;
  public renderingMode = '3d' as const;
  public debug: boolean = false;
  public map: Map;
  public tb: any;

  private _tb?: any;

  public constructor(id: string = 'threeLayer', debug: boolean = false, map: Map, tb: any) {
    this.id = id;
    this.debug = debug;
    this.map = map;
    this._tb = tb
  }

  public onAdd(map: Map, gl: WebGLRenderingContext) {
    stats = new Stats();
    if (this.debug) map.getContainer().appendChild(stats.dom);
    animate();
  }

  public render(gl: WebGLRenderingContext, matrix: number[]) {
    this._tb.update();

    const scene = this._tb.scene
    scene.traverse((object: any) => {
      if (object.type === 'Group') {
        object.children.forEach((child: any) => {
          child.traverse((object: any) => {
            if (object.type === 'Mesh') this._updateMeshMaterials(object);
          });
        });
      };
    });

    // this._tb.update();
    this.map.triggerRepaint();
  }
  /**
   * @param object ThreeJs object, with coordinates in meters
   * @param lngLat Coordinates at which to place the object
   */
  public addObject2Scene(object: any) {
    object.setRotation({ x: 90, y: 0, z: 0 })
    console.log('object: +++++++++++++++++++++++++++++++++++++++++++++++++++', object);
    this._tb.add(object);
  }

  public generateThreeBoxGeometryObject(type: string, options: any) {
    const tb = this._tb;
    const geometry = tb[type](options);
    if (options.origin) {
      geometry.setCoords(options.origin)
    }
    return geometry;
  }

  private _updateMeshMaterials(obj: any) {
    if (obj.material && obj.material.map) {
      obj.material.map.offset.y += 0.01;;
    } else {
      return null
    }
  }
}
