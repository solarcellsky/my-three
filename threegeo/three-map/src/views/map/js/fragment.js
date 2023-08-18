export default /* glsl */`
#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif

// https://github.com/mrdoob/three.js/pull/22425
#ifdef USE_TRANSMISSION
diffuseColor.a *= transmissionAlpha + 0.1;
diffuseColor.a=diffuseColor.a*mix(1.0,0.0,vPosition.z/20.0;
#endif

gl_FragColor = vec4( outgoingLight, diffuseColor.a );
`;
