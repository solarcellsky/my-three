import * as THREE from 'three';


export default function (data) {
  console.log(data)
  let texture = new THREE.TextureLoader().load("http://localhost:3000/file/getFile/map/wall.png")
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; //每个都重复
  texture.repeat.set(1, 1)
  texture.needsUpdate = true


  let geometry = new THREE.CylinderGeometry(data.radiusTop, data.radiusBottom, data.height, 32);
  let materials = [
    new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
      transparent: true
    }),
    new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    }),
    new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    })
  ]
  let mesh = new THREE.Mesh(geometry, materials)
  mesh.position.y=data.height/2
  mesh.position.set(data.x,data.y/2,data.z)
  return mesh;
}
