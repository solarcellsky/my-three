import * as THREE from 'three';
import {OrbitControls} from "three/examples/jsm/controls/OrbitControls";
import {stats} from 'three/examples/jsm/libs/stats.module'
export default class Scene {
  constructor(container) {
    this.container = container;
    this.init(container);
    this.camera();
    this.cameraControls()
    this.lights();
    this.renderer
  }

  /**
   * 初始化场景
   */
  init(container) {
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(container.clientWidth,container.clientHeight);//设置渲染区域尺寸
    //this.renderer.setClearColor(0x3f504b, 1); //设置背景颜色
    this.renderer.toneMapping=THREE.ReinhardToneMapping
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.container.appendChild(this.renderer.domElement);//body元素中插入canvas对象
    this.renderer.shadowMap.enabled=true
    this.scene = new THREE.Scene();
    this.scene.background=new THREE.Color(0x001111)
    this.scene.fog=new THREE.Fog(0x001111,10,600)
  }

  /**
   * 初始化相机
   */
  camera() {
    this.camera = new THREE.PerspectiveCamera(50, this.container.clientWidth / this.container.clientHeight, 1, 2000 );
    this.camera.position.set(0, 300, 0)//设置相机位置
    this.camera.lookAt( 0, 0, 0 );
  }

  /**
   * 相机控制
   */
  cameraControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    //this.controls.target.set(0,30,0)
    //限制最大仰视角和俯视角
    this.controls.minPolarAngle = 0
    this.controls.maxPolarAngle = 1.5
    //禁止缩放
    //this.controls.enableZoom=false
    //缩放限制
    // this.controls.minDistance = 0
    // this.controls.maxDistance = 200
    //是否使用键盘
    this.controls.enableKeys = false

    //是否可以平移
    // this.controls.enablePan=false

    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.PAN,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.ROTATE
    }
  }

  lights() {
    this.light=new THREE.PointLight(0xffffff)
    this.light.position.set(0,100,0)
    this.light.castShadow=true
    this.scene.add(this.light)

    this.scene.add(new THREE.AmbientLight())
  }
}
