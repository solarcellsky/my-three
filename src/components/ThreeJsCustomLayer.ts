import type { Map, CustomLayerInterface, LngLatLike } from 'mapbox-gl';
import type { Object3D, Mesh } from 'three';

import { MercatorCoordinate } from 'mapbox-gl';
import { Camera, DirectionalLight, HemisphereLight, AxesHelper, Matrix4, Scene, Vector3, WebGLRenderer } from 'three';

export class ThreeJsCustomLayer implements CustomLayerInterface {
  public id: string;
  public type = 'custom' as const;
  public renderingMode = '3d' as const;

  private _scene = new Scene();
  private _camera = new Camera();
  private _cameraTransform = new Matrix4();
  private _enabled = true;

  private _map?: Map;
  private _center?: Required<MercatorCoordinate>;
  private _renderer?: WebGLRenderer;

  public constructor(id: string = 'threeLayer') {
    this.id = id;
  }

  public onAdd(map: Map, gl: WebGLRenderingContext) {
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
  }

  public render(gl: WebGLRenderingContext, matrix: number[]) {
    if (!this._map || !this._renderer) throw new Error("Custom Layer has not been added to the map yet.");

    this._camera.projectionMatrix = new Matrix4().fromArray(matrix).multiply(this._cameraTransform);
    this._renderer.state.reset();

    if (!this._enabled) return;

    // const mapInstance = this._map;
    const lngLat: LngLatLike = [116.396467, 39.907173];
    // 确保模型在地图上正确地理参照的参数
    const modelOrigin: LngLatLike = lngLat,
      modelAltitude = 0,
      modelRotate = [Math.PI / 2, 0, 0],
      modelScale = 5.41843220338983e-8;

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
      scale: MercatorCoordinate.fromLngLat(modelOrigin, modelAltitude).meterInMercatorCoordinateUnits(),
      // scale: modelScale,
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
   * @param lnglat Coordinates at which to place the object
   * @param altitude altitude at which to place the object
   */
  public addObjectAtLocation(object: Object3D, lnglat: LngLatLike, altitude = 0) {
    if (!this._center) throw new Error("Custom Layer has not been added to the map yet.");
    const { x, y, z } = this._center;
    const coord = MercatorCoordinate.fromLngLat(lnglat, altitude) as Required<MercatorCoordinate>;
    const scale = coord.meterInMercatorCoordinateUnits();
    const matrix = new Matrix4()
      .makeTranslation(coord.x - x, coord.y - y, coord.z - z)
      .scale(new Vector3(scale, -scale, scale));

    object.applyMatrix4(matrix);
    this._scene.add(object);
  }

  /**
   * @param object ThreeJs object, with coordinates in Mercator Coordinates
   */
  public addGeographicObject(object: Mesh) {
    if (!this._center) throw new Error("Custom Layer has not been added to the map yet.");
    const { x, y } = this._center;
    object.applyMatrix4(new Matrix4().makeTranslation(-x, -y, 0));
    this._updateMeshMaterials(object)
    this._scene.add(object);
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

  private _updateMeshMaterials(obj: any) {
    if (obj.material && obj.material.map) {
      obj.material.map.offset.y += 0.01;;
    } else {
      return null
    }
  }

  private _setupLights(): void {
    const hemiLight = new HemisphereLight(0xffffff, 0x444444);
    hemiLight.position.set(0, 20, 0);

    const dirLight = new DirectionalLight(0xffffff);
    dirLight.position.set(-3, 10, -10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 2;
    dirLight.shadow.camera.bottom = -2;
    dirLight.shadow.camera.left = -2;
    dirLight.shadow.camera.right = 2;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 40;

    this._scene.add(hemiLight);
    this._scene.add(dirLight);
    this._scene.add(new AxesHelper(10000000));
  }
}