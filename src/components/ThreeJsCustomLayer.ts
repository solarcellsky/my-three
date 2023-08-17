import type { Map, CustomLayerInterface, LngLatLike } from 'mapbox-gl';
import type { Event, Object3D } from 'three';

import Stats from "three/examples/jsm/libs/stats.module.js";
import { MercatorCoordinate } from 'mapbox-gl';
import {
  PerspectiveCamera,
  DirectionalLight,
  HemisphereLight,
  AxesHelper,
  Raycaster,
  DirectionalLightHelper,
  HemisphereLightHelper,
  Group,
  Mesh,
  GridHelper,
  Matrix4,
  Scene,
  Color,
  Vector3,
  Vector2,
  WebGLRenderer,
  Spherical,
  BoxGeometry,
  BoxHelper,
  MeshBasicMaterial
} from 'three';


// 地球(赤道)半径(米)
const earthRad = 6378137;

let stats: {
  dom: any; update: () => void;
};
function animate() {
  requestAnimationFrame(animate);
  stats.update();
}

export class ThreeJsCustomLayer implements CustomLayerInterface {
  public id: string;
  public type = 'custom' as const;
  public renderingMode = '3d' as const;
  public debug: boolean = false;

  private _scene = new Scene();
  private _camera = new PerspectiveCamera();
  private _cameraTransform = new Matrix4();
  private _enabled = true;

  private _map?: Map;
  private _center?: Required<MercatorCoordinate>;
  private _renderer?: WebGLRenderer;
  private _origin?: any[];

  public constructor(id: string = 'threeLayer', origin: any = [0, 0], debug: boolean = false) {
    this.id = id
    this.debug = debug
    this._origin = origin
  }

  public onAdd(map: Map, gl: WebGLRenderingContext) {
    stats = new Stats();
    if (this.debug) map.getContainer().appendChild(stats.dom) && animate();

    this._map = map;
    this._center = MercatorCoordinate.fromLngLat(map.getCenter(), 0) as Required<MercatorCoordinate>;
    this._cameraTransform = this._cameraTransform.makeTranslation(this._center.x, this._center.y, this._center.z);

    this._renderer = new WebGLRenderer({
      canvas: map.getCanvas(),
      context: gl,
      alpha: true,
      antialias: true,
    });

    this._renderer.autoClear = false;
    this._renderer.shadowMap.enabled = true;

    this._setupLights();
    this._showInfo('')
  }

  public render(gl: WebGLRenderingContext, matrix: number[]) {
    if (!this._map || !this._renderer) throw new Error("Custom Layer has not been added to the map yet.");

    this._camera.projectionMatrix = new Matrix4().fromArray(matrix).multiply(this._cameraTransform);
    this._renderer.state.reset();

    if (!this._enabled) return;

    // 确保模型在地图上正确地理参照的参数
    const modelOrigin: any = this._origin,
      modelAltitude = 0,
      modelRotate = [Math.PI / 2, 0, 0];

    // 用于在地图上定位、旋转和缩放三维模型的变换参数
    const modelTransform = {
      translateX: MercatorCoordinate.fromLngLat(
        modelOrigin,
        modelAltitude
      ).x,
      translateY: MercatorCoordinate.fromLngLat(
        modelOrigin,
        modelAltitude
      ).y,
      translateZ: MercatorCoordinate.fromLngLat(
        modelOrigin,
        modelAltitude
      ).z || 0,
      rotateX: modelRotate[0],
      rotateY: modelRotate[1],
      rotateZ: modelRotate[2],
      /*由于我们的3D模型是以真实世界的米为单位的，因此需要进行比例变换
       *应用，因为CustomLayerInterface需要墨卡托坐标中的单位。
       */
      scale: MercatorCoordinate.fromLngLat(modelOrigin, modelAltitude).meterInMercatorCoordinateUnits()
    };

    const rotationX = new Matrix4().makeRotationAxis(
      new Vector3(1, 0, 0),
      modelTransform.rotateX
    );
    const rotationY = new Matrix4().makeRotationAxis(
      new Vector3(0, 1, 0),
      modelTransform.rotateY
    );
    const rotationZ = new Matrix4().makeRotationAxis(
      new Vector3(0, 0, 1),
      modelTransform.rotateZ
    );

    const m = new Matrix4().fromArray(matrix);
    const l = new Matrix4()
      .makeTranslation(
        modelTransform.translateX,
        modelTransform.translateY,
        modelTransform.translateZ
      )
      .scale(
        new Vector3(
          modelTransform.scale,
          -modelTransform.scale,
          modelTransform.scale
        )
      )
      .multiply(rotationX)
      .multiply(rotationY)
      .multiply(rotationZ);

    this._camera.projectionMatrix.elements = matrix;
    this._camera.projectionMatrix = m.multiply(l);
    this._renderer.render(this._scene, this._camera);

    this._scene.traverse((object: any) => {
      if (object.isMesh) this._updateMeshMaterials(object);
    });

    this._map.triggerRepaint();
  }

  /**
   * @param object ThreeJs object, with coordinates in meters
   * @param lngLat Coordinates at which to place the object
   * @param altitude altitude at which to place the object
   */
  public addObject3D2Scene(object: Object3D | any, lngLat: LngLatLike, eventName: string) {
    if (!this._center) throw new Error("Custom Layer has not been added to the map yet.");
    if (lngLat) {
      const coord = this._calculateRelativeCoordinate(this._origin, lngLat) || { x: 0, y: 0, z: 0 };
      const matrix = new Matrix4().makeTranslation(coord.x, coord.y, coord.z);

      object.applyMatrix4(matrix);
    }
    this._scene.add(object);
    this._addBoxHelper(object, this._scene);

    if (eventName) window.addEventListener(eventName, (e) => this._onDocumentMouseDown(e, this._scene.children, this._renderer), false);
  }

  /**
   * @param object ThreeJs object, with coordinates in meters
   * @param lngLat Coordinates at which to place the object
   * @param altitude altitude at which to place the object
   */
  public addGeographicObject2Scene(object: any, lngLat: LngLatLike, eventName: string) {

    if (!this._center) throw new Error("Custom Layer has not been added to the map yet.");

    if (lngLat) {
      const coord = this._calculateRelativeCoordinate(this._origin, lngLat) || { x: 0, y: 0, z: 0 };
      const matrix = new Matrix4()
        .makeTranslation(coord.x, coord.y, coord.z)
      object.applyMatrix4(matrix);
    }

    this._scene.add(object);
    this._addBoxHelper(object, this._scene);

    if (eventName) window.addEventListener(eventName, (e) => this._onDocumentMouseDown(e, this._scene.children, this._renderer), false);
  }

  public enable() {
    this._enabled = true;
  }

  public disable() {
    this._enabled = false;
  }

  public remove(obj: Object3D) {
    this._scene.remove(obj);
  }

  private _addBoxHelper(obj: any, scene: any) {
    if (this.debug) {
      const box = new BoxHelper(obj);
      scene.add(box);
    }
  }

  private _updateMeshMaterials(obj: any) {
    if (obj.material && obj.material.map) {
      // obj.material.map.offset.x += 0.01;
      obj.material.map.offset.y += 0.01;
    } else {
      return null
    }
  }

  /**
   * 经纬度转墨卡托xyz
   * @param lngLat 经纬度
   */
  private _lngLat2MercatorCoordinate(lngLat: any = [0, 0]) {
    if (!lngLat) return { x: 0, y: 0, z: 0 };
    const mercator = { x: 0, y: 0, z: 0 };
    mercator.x = ((lngLat[0] * Math.PI) / 180) * earthRad;
    const local_array = (lngLat[1] * Math.PI) / 180;
    mercator.y =
      (earthRad / 2) *
      Math.log((1.0 + Math.sin(local_array)) / (1.0 - Math.sin(local_array)));
    mercator.z = 0;

    return mercator;
  }

  /**
   * 经纬度转ThreeJS坐标
   * @param lngLat 经纬度
   */
  private _lngLat2ThreeJsCoordinate(lngLat: any = [0, 0]) {
    let spherical = new Spherical();
    spherical.radius = earthRad;
    const lng = lngLat[0]
    const lat = lngLat[1]
    const theta = (lng + 90) * (Math.PI / 180)
    const phi = (90 - lat) * (Math.PI / 180)
    spherical.phi = phi; // phi是方位面（水平面）内的角度，范围0~360度
    spherical.theta = theta; // theta是俯仰面（竖直面）内的角度，范围0~180度
    let position = new Vector3()
    position.setFromSpherical(spherical)
    return position
  }

  private _calculateRelativeCoordinate(origin: any = [0, 0], end: any = [0, 0]) {
    const _origin = this._lngLat2ThreeJsCoordinate(origin)
    const _end = this._lngLat2ThreeJsCoordinate(end)
    return { x: _origin.x - _end.x, y: 0, z: _origin.z - _end.z }

  }

  private _setupLights(): void {
    // lights
    const directionalLight = new DirectionalLight(0xffffff);
    directionalLight.position.set(50, 200, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.top = 2;
    directionalLight.shadow.camera.bottom = -2;
    directionalLight.shadow.camera.left = -2;
    directionalLight.shadow.camera.right = 2;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 40;

    const hemisphereLight = new HemisphereLight(0xffffff, 0x444444, 1);
    hemisphereLight.position.set(0, 20, 0);

    const lightGroup = new Group();
    lightGroup.add(directionalLight, hemisphereLight);
    this._scene.add(lightGroup);

    // ThreeJS 中采用的是右手坐标系
    // 红线是X轴，绿线是Y轴，蓝线是Z轴
    const axesHelper = new AxesHelper(100000);
    const axesHelperCube_geometry = new BoxGeometry(50, 50, 50);
    const axesHelperCube_material = new MeshBasicMaterial({
      transparent: true,
      color: 0xffff00,
      opacity: 0.9,
    });
    const axesHelperCube = new Mesh(
      axesHelperCube_geometry,
      axesHelperCube_material
    );
    const gridHelper = new GridHelper(100000, 160);
    const directionalLightHelper = new DirectionalLightHelper(directionalLight, 1500);
    const hemisphereLightHelper = new HemisphereLightHelper(hemisphereLight, 1000);
    const helperGroup = new Group();
    helperGroup.add(axesHelper, axesHelperCube, gridHelper, directionalLightHelper, hemisphereLightHelper);

    if (this.debug) this._scene.add(helperGroup);
  }

  private _showInfo(content: string): void {
    const existedDom = document.getElementById('sceneInfo');
    if (existedDom) {
      existedDom.innerText = content ? content : '点击界面显示相关信息'
    } else {
      const dom = document.createElement('div');
      dom.setAttribute('style', 'position: fixed;left: 0;bottom: 0;width: 100%;z-index: 1;background-color: #ffffff;padding: 10px 20px');
      dom.setAttribute('id', 'sceneInfo');
      const target = document.getElementsByTagName('body')[0];
      target.appendChild(dom);

      dom.innerText = content ? content : '点击界面显示相关信息';
    };
  }

  private _onDocumentMouseDown(event: any, objects: any[], renderer: any): void {
    event.preventDefault();
    const raycaster = new Raycaster();
    const mouse = new Vector2();

    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = - (event.clientY / renderer.domElement.clientHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, this._camera);

    const intersects = raycaster.intersectObjects(objects);

    if (intersects.length > 0) {
      const _object = intersects[0].object;
      console.log('_object: ', _object);
      this._showInfo(_object.name);
    }
  }
}