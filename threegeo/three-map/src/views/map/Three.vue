<template>
  <div id="blocker" style="width:100%;height: 100%;">

    <div style="width: 100%;height: 100%;"
         id="container">
    </div>

  </div>
</template>

<script type="module">
  import * as THREE from 'three'
  import Editor from './js/Editor'
  import {FBXLoader} from 'three/examples/jsm/loaders/FBXLoader'
  import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'
  import {TransformControls} from 'three/examples/jsm/controls/TransformControls'
  import * as geolib from 'geolib';
  import Stats from 'three/examples/jsm/libs/stats.module'
  import {BufferGeometryUtils} from 'three/examples/jsm/utils/BufferGeometryUtils'
  import {Water} from 'three/examples/jsm/objects/Water'


  import {Waves, Wall,FlyLine,SweepLightShader} from './js/Index'
  import fragment from './js/fragment'
  let container, editor
  let renders

  //扫光
  const clock = new THREE.Clock()
  let buildingHeight
  const uniform = {
    u_color: { value: new THREE.Color("#5588aa") },
    u_tcolor: { value: new THREE.Color("red") },
    u_r: { value: 0.25 },
    u_length: { value: 10 }, //扫过区域
    u_height:{value:30.5}
  };
  const Shader=SweepLightShader
  console.log(Shader)

  const material = new THREE.ShaderMaterial({
    vertexShader: Shader.Shader.vertexShader,
    fragmentShader: Shader.Shader.fragmentShader,
    side: THREE.DoubleSide,
    uniforms: uniform,
    transparent: true,
    depthWrite: false,
  });

  //雷达
  const radarData = [{
    position: {
      x: 46.88517423323151,
      y: 0,
      z: 90
    },
    radius: 30,
    color: '#efad35',
    opacity: 0.6,
    speed: 1
  }];
  //光墙
  const wallData = [{
    radiusTop: 5,
    radiusBottom: 5,
    height: 6,
    x: 64.55602264404297,
    y: 0.015804717016143055,
    z: -71.84718322753906
  },]

  //飞线
  let indexMax
  let index
  let num
  let points2

  let geometry2

  let texture=new THREE.TextureLoader().load('http://localhost:3000/file/getFile/map/waves.jpeg')
  texture.wrapS=THREE.RepeatWrapping
  texture.wrapT=THREE.RepeatWrapping

  export default {
    name: 'map',
    data() {
      return {
        stats: null,
        center: [106.5500757,
          29.5602997],
        MAT_BUILDING: null,
        raycaster: null,
        geos_building: [],
        helperArr: [],
        MAT_ROAD: null,
        iR: null,
        FLAG_ROAD_ANI: true,
        iR_Line: null,
        Animated_Line_Distances: [],
        MAT_WATER_NORMALE: null,
        MAT_WATER: null,
        waterGroup: null,
        buildingGroup: null,
        lightEfficiencyGroup: null,
        flyGroup:null,
        time: {
          value: 0
        },
        wallMesh: {
          time: 0,
          opacity: 1
        },
        points:null,
      }
    },
    components: {},
    mounted() {

    },
    methods: {
      adds(url) {
        window.addEventListener('resize', this.onWindowResize, false)//屏幕适应监听
        window.addEventListener('click', this.onWindowResize, false)//屏幕适应监听


        document.getElementById('container').addEventListener('mousedown', this.rayModel)

        const that = this
        container = document.getElementById('container')
        // container.addEventListener('click', this.transformControlsRemove, false)

        editor = new Editor(container, url)
        editor.scene.renderer.domElement.style.outline = 'none'
        container.appendChild(editor.scene.renderer.domElement)

        editor.model.loadModel()
        let modelLoadInterval = setInterval(() => {
          if (editor.model) {
            clearInterval(modelLoadInterval)
          }
        }, 100)
        that.initModel()
        that.initScenario()
      },
      //初始化
      initScenario() {
        //创建一个地板，如果只有网格，不能得到点击位置的坐标
        let geometry = new THREE.PlaneGeometry(700, 700)
        geometry.rotateX(-Math.PI / 2)
        let mail = new THREE.MeshBasicMaterial({color:0x696969})
        let plane = new THREE.Mesh(geometry, mail)
        plane.name = 'Plane'
        plane.position.y = -1
        plane.receiveShadow = true
        editor.scene.scene.add(plane)


        //网格
        var gridHelper = new THREE.GridHelper(1000, 40)
        // editor.scene.scene.add(gridHelper)

        this.MAT_BUILDING = new THREE.MeshPhongMaterial({color:0x4682B4})
        // this.stats = new Stats()
        // editor.scene.scene.add(this.stats.domElement)


        this.raycaster = new THREE.Raycaster()

        this.iR_Line = new THREE.Group()

        this.waterGroup = new THREE.Group()

        this.buildingGroup = new THREE.Group()

        this.lightEfficiencyGroup = new THREE.Group()
        this.flyGroup= new THREE.Group()
        this.$nextTick(() => {
          editor.scene.scene.add(this.iR_Line)
          editor.scene.scene.add(this.waterGroup)
          editor.scene.scene.add(this.buildingGroup)
          editor.scene.scene.add(this.lightEfficiencyGroup)
          editor.scene.scene.add(this.flyGroup)
          console.log(this.buildingGroup)

        })


        this.animate()
        this.initWaves()
      },
      rayModel(ev) {
        let that = this
        ev.preventDefault()
        let getBoundingClientRect = container.getBoundingClientRect()
        // 屏幕坐标转标准设备坐标
        let x = ((event.clientX - getBoundingClientRect.left) / container.offsetWidth) * 2 - 1// 标准设备横坐标
        let y = -((event.clientY - getBoundingClientRect.top) / container.offsetHeight) * 2 + 1// 标准设备纵坐标
        let standardVector = new THREE.Vector3(x, y, 1)// 标准设备坐标
        // 标准设备坐标转世界坐标
        let worldVector = standardVector.unproject(editor.scene.camera)
        // 射线投射方向单位向量(worldVector坐标减相机位置坐标)
        let ray = worldVector.sub(editor.scene.camera.position).normalize()
        // 创建射线投射器对象
        let rayCaster = new THREE.Raycaster(editor.scene.camera.position, ray)
        // 返回射线选中的对象 第二个参数如果不填 默认是false
        //editor.scene.scene.children
        let intersects = rayCaster.intersectObjects(editor.scene.scene.children, true)

        if (intersects.length > 0) {
          console.log(intersects)
          // console.log(that.helperArr)
          let mail = new THREE.MeshPhongMaterial({color: 0xffff00})
          // intersects[0].object.material = mail
        }
      },

      //加载建筑Json数据
      initModel() {
        let that = this
        // http://localhost:3000/file/getFile/map/export2.geojson
        fetch("http://localhost:3000/file/getFile/map/export.geojson").then((res) => {
          res.json().then((data) => {
            that.loadBuilding(data)
          })
        })

      },
      //判断是建筑数据与公路数据
      loadBuilding(data) {
        let that = this
        let features = data.features
        that.MAT_ROAD = new THREE.LineBasicMaterial({color: 0x254360})
        features.forEach(item => {
          let fel = item
          if (!fel['properties']) return

          let info = fel.properties
          if (fel.properties['building']) {
            this.addBuilding(fel.geometry.coordinates, fel.properties, fel.properties['building:levels'])
          } else if (info['highway']) {
            if (fel.geometry.type == "LineString" && info['highway'] != 'pedestrian' && info['highway'] != 'footway' && info['highway'] != 'path') {
              that.addRoad(fel.geometry.coordinates, info)
            }
          }

        })


        console.log(that.buildingGroup)
        that.centerAll(that.buildingGroup)
        // this.$nextTick(() => {
        //   let mergeGeometry = BufferGeometryUtils.mergeBufferGeometries(that.geos_building)
        //   let mesh = new THREE.Mesh(mergeGeometry, that.MAT_BUILDING)
        //   // mesh.rotateX(Math.PI * 0.5)
        //   // mesh.rotateY(Math.PI)
        //   // mesh.rotateZ(Math.PI * -0.5)
        //
        //   // var object = new THREE.Mesh( mergeGeometry, new THREE.MeshBasicMaterial(0xff0000) );
        //   // var box = new THREE.BoxHelper( object );
        //   // editor.scene.scene.add( box );
        //
        //   editor.scene.scene.add(mesh)
        // })
        that.$nextTick(() => {
          // that.LoadWaters()

        })
      },
      centerAll(group){
        let box3=new THREE.Box3()
        box3.expandByObject(group)
        console.log('查看包围盒box3',box3)
        let size=new THREE.Vector3()
        box3.getSize(size)
        console.log('查看包围盒尺寸',size)
        buildingHeight=size.y
        let center=new THREE.Vector3()
        box3.getCenter(center)
        console.log('几何中心',center)
      },
      //路线，线条
      addRoad(data, info) {
        let points = []
        for (let i = 0; i < data.length; i++) {
          if (!data[0][1]) return

          let el = data[i]
          if (!el[0] || !el[1]) return;

          let elp = [el[0], el[1]]
          elp = this.GPSRelativePosition([elp[0], elp[1]], this.center)

          points.push(new THREE.Vector3(elp[0], 0.5, elp[1]))
        }

        let geometry = new THREE.BufferGeometry().setFromPoints(points)
        geometry.rotateZ(Math.PI)

        let line = new THREE.Line(geometry, this.MAT_ROAD)
        line.computeLineDistances()
        // this.iR.add(line)
        this.iR_Line.add(line)

        if (this.FLAG_ROAD_ANI) {
          let lineLength = geometry.attributes.lineDistance.array[geometry.attributes.lineDistance.count - 1]

          if (lineLength > 0.8) {
            let aniLine = this.addAnimatedLine(geometry, lineLength)
            this.iR_Line.add(aniLine)
          }
        }
      },
      //添加线条
      addAnimatedLine(geometry, length) {
        let animatedLine = new THREE.Line(geometry, new THREE.LineDashedMaterial({color: 0x00ffff}))
        animatedLine.material.dashSize = 0
        animatedLine.material.gapSize = 500

        animatedLine.material.transparent = true

        this.Animated_Line_Distances.push(length)

        return animatedLine
      },
      //道路流光
      UpdateAnimatedLine() {
        if (this.iR_Line.children.length <= 0) return

        // console.log(this.Animated_Line_Distances,this.iR_Line.children)
        for (let i = 0; i < this.iR_Line.children.length; i++) {
          let line = this.iR_Line.children[i]

          let dash = parseInt(line.material.dashSize)
          let length = parseInt(this.Animated_Line_Distances[i])
          // console.log(length)
          if (this.Animated_Line_Distances.length > i) {
            // console.log(dash,length)
            if (dash > length) {
              line.material.dashSize = 0
              line.material.opacity = 1
            } else {
              line.material.dashSize += 0.1
              line.material.opacity = line.material.opacity > 0 ? line.material.opacity - 0.0002 : 0
            }
          }

        }
      },
      //加载水流与水纹理
      LoadWaters() {
        this.MAT_WATER_NORMALE = new THREE.TextureLoader().load('http://localhost:3000/file/getFile/map/water.jpeg', (texture) => {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping
        })

        this.MAT_WATER = {
          textureWidth: 512,
          textureHeight: 512,
          waterNormals: new THREE.TextureLoader().load('http://localhost:3000/file/getFile/map/water.jpeg', (texture) => {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping
          }),
          alpha: 1.0,
          sunDirection: new THREE.Vector3(),
          sunColor: 0xffffff,
          waterColor: 0x001e0f,
          distortionScale: 3.7,
          fog: false
        }

        fetch("http://localhost:3000/file/getFile/map/water.geojson").then((res) => {
          res.json().then((data) => {
            console.log(data)
            let features = data.features
            for (let i = 0; i < features.length; i++) {
              let fel = features[i]
              if (fel.properties['natural'] == 'water' && fel.geometry.type == 'Polygon') {
                this.addWater(fel.geometry.coordinates, fel.properties)
              }
            }

          })
        })

      },
      //水
      addWater(data, info) {
        let shape, geometry, mesh
        let holes = []
        for (let i = 0; i < data.length; i++) {
          let el = data[i]
          if (i == 0) {
            shape = this.genShape(el, this.center)
          } else {
            holes.push(this.genShape(el, this.center))
          }
        }

        for (let i = 0; i < holes.length; i++) {
          shape.holes.push(holes[i])
        }

        geometry = this.genGeometry(shape, {
          curveSegment: 1,
          depth: 0.1,
          bevelEnabled: false
        })

        geometry.rotateX(Math.PI / 2)
        geometry.rotateZ(Math.PI)

        let water = new Water(geometry, this.MAT_WATER)
        this.waterGroup.add(water)
      },
      //水流
      UpdataWater() {
        // this.waterGroup.children.forEach(item=>{
        //   this.material.uniforms['time'].value
        // })
        for (let i = 0; i < this.waterGroup.children.length; i++) {
          this.waterGroup.children[i].material.uniforms['time'].value += 1.0 / 50
        }
      },
      //加载建筑
      addBuilding(data, info, height = 30) {

        let shape, geometry, mesh
        let holes = []
        for (let i = 0; i < data.length; i++) {
          let el = data[i]
          if (i == 0) {
            //整体
            shape = this.genShape(el, this.center)
          } else {
            //挖洞
            holes.push(this.genShape(el, this.center))
          }
        }

        for (let i = 0; i < holes.length; i++) {
          shape.holes.push(holes[i])
        }

        geometry = this.genGeometry(shape, {
          curveSegment: 1,
          depth: 0.05 * (height == 30 ? height : height * 10),
          bevelEnabled: false
        })

        geometry.rotateX(Math.PI / 2)
        geometry.rotateZ(Math.PI)

        mesh = new THREE.Mesh(geometry, material)
        mesh.name = info['name'] ? info['name'] : 'Building'
        mesh.info = info
        // editor.scene.scene.add(mesh)
        this.buildingGroup.add(mesh)
        //线框
        let edges = new THREE.EdgesGeometry( geometry );
        let line = new THREE.LineSegments( edges, new THREE.LineBasicMaterial( { color: 0xffffff } ) );
        editor.scene.scene.add( line );

        // this.geos_building.push(geometry)
        // let helper = this.genHelper(geometry)
        //
        // if (helper) {
        //   helper.name = info['name'] ? info['name'] : 'Building'
        //   helper.info = info
        //   this.helperArr.push(helper)
        // }
      },
      //包围盒
      genHelper(geometry) {
        if (!geometry.boundingBox) {
          geometry.computeBoundingBox()
        }
        let box3 = geometry.boundingBox
        if (!isFinite(box3.max.x)) {
          return false
        }
        let helper = new THREE.Box3Helper(box3, 0xffff00)
        helper.updateMatrixWorld()

        return helper
      },
      genGeometry(shape, config) {
        let geometry = new THREE.ExtrudeBufferGeometry(shape, config)
        geometry.computeBoundingBox()
        return geometry
      },
      genShape(points) {
        let shape = new THREE.Shape()
        points.forEach((item, i) => {
          let elp = item
          elp = this.GPSRelativePosition(elp, this.center)
          if (i == 0) {
            shape.moveTo(elp[0], elp[1])
          } else {
            shape.lineTo(elp[0], elp[1])
          }
        })
        return shape
      },
      GPSRelativePosition(objPosi, centerPosi) {
        let dis = geolib.getDistance(objPosi, centerPosi)
        let bearing = geolib.getRhumbLineBearing(objPosi, centerPosi)
        let x = centerPosi[0] + (dis * Math.cos(bearing * Math.PI / 180))
        let y = centerPosi[1] + (dis * Math.sin(bearing * Math.PI / 180))
        return [-x / 10, y / 10]
      },
      //光效
      initWaves() {
        let that=this
        setTimeout(() => {
          this.isStart = true;
          // 加载扫描效果
          radarData.forEach((data) => {
            const mesh = Waves(data);
            mesh.material.uniforms.time = this.time;
            this.lightEfficiencyGroup.add(mesh);
          });
          //光墙
          wallData.forEach((data) => {
            const mesh = Wall(data);
            mesh.name="wallData"
            this.lightEfficiencyGroup.add(mesh);
            setInterval(()=>{

            },100)
          });
          //锥形标识
          {
            let geometry = new THREE.ConeGeometry( 2, 5, 4 );
            let material = new THREE.MeshLambertMaterial(
              {
                // color: 0x694d9f,
               map:new THREE.TextureLoader().load("http://localhost:3000/file/getFile/map/wall.png"),
                transparent:true,
                depthTest: false
              });
            let cone = new THREE.Mesh( geometry, material );
            cone.rotateZ(Math.PI)
            cone.position.set(15.5,35,-162.6)
            // editor.scene.scene.add( cone );
            this.lightEfficiencyGroup.add(cone);
          }
          //光墙
          {
            let data = [
              0, 0,
              25, 0,
              25, 25,
              0, 25,
              0, 0
            ]
            var geometry = new THREE.BufferGeometry()
            var posArr = []
            var h = 5
            var uvrr = []
            for (let i = 0; i < data.length - 2; i += 2) {
              posArr.push(data[i], data[i + 1], 0, data[i + 2], data[i + 3], 0, data[i + 2], data[i + 3], h)
              posArr.push(data[i], data[i + 1], 0, data[i + 2], data[i + 3], h, data[i], data[i + 1], h)

              uvrr.push(0, 0, 1, 0, 1, 1)
              uvrr.push(0, 0, 1, 1, 0, 1)
            }


            geometry.attributes.position = new THREE.BufferAttribute(new Float32Array(posArr), 3)
            geometry.attributes.uv = new THREE.BufferAttribute(new Float32Array(uvrr), 2)




            // new THREE.TextureLoader().load("http://localhost:3000/file/getFile/map/wall.png")
            geometry.computeVertexNormals()
            var material = new THREE.MeshLambertMaterial({
              map:texture,
              color: 0x00ffff,
              side: THREE.DoubleSide,
              transparent: true,
              // opacity:0.5,
              depthTest: false
            })

            let mesh = new THREE.Mesh(geometry, material)
            mesh.rotateX(-Math.PI / 2)
            // editor.scene.scene.add(mesh)
            this.lightEfficiencyGroup.add(mesh);
          }
          //飞线
          {
            /**
             * 创建线条模型
             */
            var geometry = new THREE.BufferGeometry(); //创建一个缓冲类型几何体
// 三维样条曲线
            var curve = new THREE.CatmullRomCurve3([
              new THREE.Vector3(100, 0, -100),
              new THREE.Vector3(0, 80, 0),
              new THREE.Vector3(-100, 0, 100),
            ]);
//曲线上等间距返回多个顶点坐标
            that.points = curve.getPoints(100); //分段数100，返回101个顶点
            // console.log(that.points)
// setFromPoints方法从points中提取数据赋值给attributes.position
            geometry.setFromPoints(that.points);
            var material = new THREE.LineBasicMaterial({
              color: 0x006666, //轨迹颜色
            });
//线条模型对象
            var line = new THREE.Line(geometry, material);
            that.flyGroup.add(line);


            index = 20; //取点索引位置
            num = 15; //从曲线上获取点数量
            points2 = that.points.slice(index, index + num); //从曲线上获取一段
            var curve = new THREE.CatmullRomCurve3(points2);
            var newPoints2 = curve.getPoints(100); //获取更多的点数
            geometry2 = new THREE.BufferGeometry();
            geometry2.setFromPoints(newPoints2);
// 每个顶点对应一个百分比数据attributes.percent 用于控制点的渲染大小
            var percentArr = []; //attributes.percent的数据
            for (var i = 0; i < newPoints2.length; i++) {
              percentArr.push(i / newPoints2.length);
            }
            var percentAttribue = new THREE.BufferAttribute(new Float32Array(percentArr), 1);
            geometry2.attributes.percent = percentAttribue;
// 批量计算所有顶点颜色数据
            var colorArr = [];
            for (var i = 0; i < newPoints2.length; i++) {
              var color1 = new THREE.Color(0x006666); //轨迹线颜色 青色
              var color2 = new THREE.Color(0xef4136); //
              var color = color1.lerp(color2, i / newPoints2.length)
              colorArr.push(color.r, color.g, color.b);
            }
// 设置几何体顶点颜色数据
            geometry2.attributes.color = new THREE.BufferAttribute(new Float32Array(colorArr), 3);

// 点模型渲染几何体每个顶点
            var PointsMaterial = new THREE.PointsMaterial({
              // color: 0xffff00,
              size: 5.0, //点大小
              vertexColors: THREE.VertexColors, //使用顶点颜色渲染
            });
            var flyPoints = new THREE.Points(geometry2, PointsMaterial);
            that.flyGroup.add(flyPoints);
// 修改点材质的着色器源码(注意：不同版本细节可能会稍微会有区别，不过整体思路是一样的)
            PointsMaterial.onBeforeCompile = function (shader) {
              // 顶点着色器中声明一个attribute变量:百分比
              shader.vertexShader = shader.vertexShader.replace(
                'void main() {',
                [
                  'attribute float percent;', //顶点大小百分比变量，控制点渲染大小
                  'void main() {',
                ].join('\n') // .join()把数组元素合成字符串
              );
              // 调整点渲染大小计算方式
              shader.vertexShader = shader.vertexShader.replace(
                'gl_PointSize = size;',
                [
                  'gl_PointSize = percent * size;',
                ].join('\n') // .join()把数组元素合成字符串
              );
            };
// 飞线动画
            indexMax = that.points.length - num; //飞线取点索引范围
          }
          //漫游
          {
            var geometry = new THREE.BufferGeometry(); //创建一个缓冲类型几何体

            var curve = new THREE.CatmullRomCurve3([
              new THREE.Vector3(30, 60, -150),
              new THREE.Vector3(100, 200, 0),
              new THREE.Vector3(-30, 60, 150),
            ]);
            //曲线上等间距返回多个顶点坐标
            let points = curve.getPoints(1000); //分段数100，返回101个顶点



            // setFromPoints方法从points中提取数据赋值给attributes.position
            geometry.setFromPoints(points);
            let material = new THREE.LineBasicMaterial({
              color: 0x006666, //轨迹颜色
            });

            for(let i=0;i<points.length;i++){
              setTimeout(()=>{
                editor.scene.camera.position.set(points[i].x, points[i].y + 5, points[i].z)
              },2000)

              editor.scene.camera.lookAt(0, 0, 0)
            }


            // 线条模型对象
            let line = new THREE.Line(geometry, material);
            // editor.scene.scene.add(line) // 线条对象添加到场景中
          }
        }, 1000);
      },
      render() {
        editor.scene.renderer.render(editor.scene.scene, editor.scene.camera)
      },
      animate() {
        let that = this
        editor.scene.controls.update()
        editor.scene.renderer.render(editor.scene.scene, editor.scene.camera)//执行渲染操作
        renders = requestAnimationFrame(that.animate) //请求再次执行渲染函数render

        //扫描
        this.time.value += 0.1;
        //光墙
        that.lightEfficiencyGroup.traverse(child=>{
          if(child.name=="wallData"){
            that.wallMesh.time += 0.1;
            that.wallMesh.opacity -= 0.005;
            if (that.wallMesh.time > 2) {
              that.wallMesh.time = 0;
              that.wallMesh.opacity = 1;
            }
            child.scale.set(1 + that.wallMesh.time, 1, 1 + that.wallMesh.time);
            child.material[0].opacity = that.wallMesh.opacity;
          }
        })

        //光波
        material.uniforms.u_r.value += clock.getDelta() * 80;
        if (material.uniforms.u_r.value >= 300) {
          material.uniforms.u_r.value = 20
        }

        //光墙流动
        texture.offset.y-=0.01


        //飞线
        if(that.points){
          if (index > indexMax) index = 0;
          index += 1
          points2 = that.points.slice(index, index + num); //从曲线上获取一段
          // console.log(points2)
          var curve = new THREE.CatmullRomCurve3(points2);
          var newPoints2 = curve.getPoints(100); //获取更多的点数
          geometry2.setFromPoints(newPoints2);
        }



        // that.UpdateAnimatedLine()
        // that.UpdataWater()


      },

      //屏幕适应
      onWindowResize() {
        editor.scene.camera.aspect = container.clientWidth / container.clientHeight
        editor.scene.camera.updateProjectionMatrix()
        editor.scene.renderer.setSize(container.clientWidth, container.clientHeight)
      },
      //删除模型
      initDispose() {
        let that = this
        if (editor.scene.scene) {
          let allChildren = editor.scene.scene.children.filter(x => x)
          allChildren.forEach(a => {
            that.dispose(editor.scene.scene, a)
          })
          editor.scene.scene.dispose()
          editor.scene.scene.remove()
          editor.scene.renderer.dispose()
          editor.scene.renderer.forceContextLoss()
          editor.scene.renderer.content = null
          editor.scene.renderer.domElement = null
          cancelAnimationFrame(renders)
        }
      },
      dispose(parent, child) {
        if (child.children.length) {
          let arr = child.children.filter(x => x)
          arr.forEach(obj => {
            this.dispose(child, obj)
          })
        }
        if (child.type === 'Mesh' || child.type === 'Line') {
          if (child.material.map) {
            if (child.material.map.dispose) {child.material.map.dispose()}
          }
          if (child.material.dispose) {child.material.dispose()}
          if (child.geometry.dispose) {child.geometry.dispose()}
        } else if (child.material) {
          if (child.material.dispose) {
            child.material.dispose()
          }
        }
        child.remove()
        parent.remove(child)
      },
    },
    destroyed() {
      this.initDispose()
    },
  }
</script>
<style scoped>
</style>
