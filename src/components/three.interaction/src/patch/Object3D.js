import * as THREE from 'three';

/**
 * whether displayObject is interactively
 */
THREE.Object3D.prototype.interactive = false;

/**
 * whether displayObject's children is interactively
 */
THREE.Object3D.prototype.interactiveChildren = true;

/**
 * whether displayObject had touchstart
 * @private
 */
THREE.Object3D.prototype.started = false;

/**
 * tracked event cache, like: touchend、mouseout、pointerout which decided by primary-event
 */
Object.defineProperty(THREE.Object3D.prototype, 'trackedPointers', {
  get() {
    if (!this._trackedPointers) this._trackedPointers = {};
    return this._trackedPointers;
  },
});

/**
 * dispatch a raycast
 *
 * @param {Raycaster} raycaster Raycaster object, get from THREE.Raycaster
 * @return {Object|Boolean} had pass hit-test
 */
THREE.Object3D.prototype.raycastTest = function(raycaster) {
  const result = [];
  this.raycast(raycaster, result);

  if (result.length > 0) {
    return result[0];
  }

  return false;
};
