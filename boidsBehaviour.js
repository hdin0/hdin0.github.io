import * as THREE from "https://threejs.org/build/three.module.js";
import Stats from 'https://threejs.org/examples/jsm/libs/stats.module.js';
// import { OrbitControls } from 'https://threejs.org/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'https://threejs.org/examples/jsm/libs/dat.gui.module.js';
import {Projector} from 'https://threejs.org/examples/jsm/renderers/Projector.js';


let altWidt = 0.75;
let altHeig = 1;
let inWidth = window.innerWidth * altWidt;
let inHeight = window.innerHeight * altHeig;

let latticePitchContents = [];
let latticePitchIntegerContents = new Array( 64000 );
let finLoading = false;
let clicked = false;

// size
var height = slen;
var width = slen;
var depth = slen;

var xMin = 0; var xMax = width;
var yMin = 0; var yMax = height;
var zMin = 0; var zMax = depth;

var sforceX = 0; var sforceY = 0; var sforceZ = 0;
var cforceX = 0; var cforceY = 0; var cforceZ = 0;
var aforceX = 0; var aforceY = 0; var aforceZ = 0;

/* GUI Parameters */
let count = 180;
// const count = 83;
//

var scene = new THREE.Scene();
  scene.background = new THREE.Color( 0x002330 );
  // scene.background = new THREE.Color( 0xECF1F9 );
var camera = new THREE.PerspectiveCamera(75, inWidth / inHeight, 0.1, 1000);
  camera.position.z = slen*1.7;
  camera.position.y = slen*0.5;
  camera.position.x = slen*0.5;

var position = new THREE.Vector3();

var renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize(inWidth, inHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener( 'resize', onWindowResize, false );
function onWindowResize() {
  inWidth = window.innerWidth * altWidt;
  inHeight = window.innerHeight * altHeig;
  camera.aspect = inWidth / inHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( inWidth, inHeight );
}

// const controls = new OrbitControls( camera, renderer.domElement );


// const geometry = new THREE.ConeGeometry(1, 4, 5.3);
const geometry = new THREE.SphereGeometry( 1, 6, 6 );
const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
let mesh = new THREE.InstancedMesh( geometry, material, count );
mesh.instanceMatrix.setUsage( THREE.DynamicDrawUsage ); //will be updated every frame
const matrix = new THREE.Matrix4();
const color = new THREE.Color();

let mouse = new THREE.Vector3(0,0,0);
//Raycaster creates a beam that extends outwards and returns an array of what objects the beam intersects with, as well as where, and other information.
let raycaster = new THREE.Raycaster( new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,0) );
let intersects = [];

function init() {

  let i = 0;
  while (i < (count)){
    let x0 = Math.floor(Math.random() * (eyeDist*2) + (slen*0.3));
    let y0 = Math.floor(Math.random() * (eyeDist*2) + (slen*0.3));
    let z0 = Math.floor(Math.random() * (eyeDist*2) + (slen*0.3));
    matrix.setPosition( x0, y0, z0 );
    boids.velocity.push( new THREE.Vector3( 0.1, 0.1, 0.1 ) );
    boids.accel.push( new THREE.Vector3( 0.1, 0.1, 0.1 ) );
    mesh.setMatrixAt( i, matrix );
      let pInt = getPitchInteger( convertToLatticeInd( x0, y0, z0 ) );
    mesh.setColorAt( i, getColor( pInt ) );
    // mesh.setColorAt( i, color.setHex( Math.random() * 0xffffff ) );\


    boids.octave.push( assignDist( dist_opt, 4, 1 ) );
    boids.partial.push( Math.abs(assignDist( dist_opt, 10, 1 )) );

    i++

  }
  scene.add( mesh );

  while ( i < (count)) {
    setInitialMovVal( i );
  }

  renderer.domElement.addEventListener( 'mousedown', onMouseDown );
}

let stats = new Stats();
document.body.appendChild( stats.dom );

function onMouseDown( event_info ) {
  event_info.preventDefault(); //stop any other event listener from receiving this event.
  mouse.x = (event.clientX / inWidth)*2 - 1;
  mouse.y = -(event.clientY / inHeight)*2 + 1;
  mouse.z = 0.5;


  raycaster.setFromCamera( mouse, camera );
  var intersects = raycaster.intersectObjects( scene.children );
  addOneThing( mouse.x, mouse.y, 0)
}

function addOneThing( x, y, z) {
  let g = new THREE.SphereGeometry( 30, 6, 6 );
  let mat = new THREE.MeshBasicMaterial({ color:  Math.random() * 0xffffff });
  let dot = new THREE.Mesh( g, mat );
  dot.position.set( x, y, z );
  console.log( x );
  console.log( y );
  console.log( z );
  scene.add( dot );
}

//

/* Boids Methods */

function getBoidPos( boidIndex ) {
  mesh.getMatrixAt( boidIndex, matrix );
  position.setFromMatrixPosition( matrix );
  return position;
}

function setInitialMovVal( boidIndex ) {
  var randDir = new THREE.Vector3( randNum(), randNum(), randNum() );
  randDir.normalize;
  boids.velocity[boidIndex] = randDir.multiplyScalar( 2 );
  boids.accel[boidIndex] = randDir.multiplyScalar( 2 );
}

//returns a number from -1 to 1
function randNum( scale ) {
  return scale*(2*(Math.random() - 0.5));
}

function calcChange( inx, iny, inz ) {

  let max_angle = 0;
  // why have three distance parameters.
  let diff = new THREE.Vector3();
  let dist = 0;
  let thetaLim = 0.7*Math.PI;
  for (let i = 0; i < count; i++ ) {
    sforceX = 0; sforceY = 0; sforceZ = 0;
    cforceX = 0; cforceY = 0; cforceZ = 0;
    aforceX = 0; aforceY = 0; aforceZ = 0;
    let n = 0;
    let n2 = 0;

    let currBoidPos = getBoidPos( i );
    let cPos = new THREE.Vector3( currBoidPos.x, currBoidPos.y, currBoidPos.z);

    for (let tar = 0; tar < count; tar++ ) {
      if (i == tar) continue
      let targetPos = getBoidPos( tar );
      let tPos = new THREE.Vector3( targetPos.x, targetPos.y, targetPos.z );
      diff = vectorToPeriodic( cPos, tPos, slen ); // gives a vector of tPos - cPos
      dist = distanceToPeriodic( cPos, targetPos, slen );
      let theta = boids.velocity[i].angleTo( diff ); // vector algebra, had to get the difference vector in the opposite dir.

      if ((dist < eyeDist) && (theta < thetaLim)){
        cforceX += diff.x;
        cforceY += diff.y;
        cforceZ += diff.z;

        aforceX += aliForce*(boids.velocity[tar].x * (1/Math.pow(dist,2)));
        aforceY += aliForce*(boids.velocity[tar].y * (1/Math.pow(dist,2)));
        aforceZ += aliForce*(boids.velocity[tar].z * (1/Math.pow(dist,2)));
        n++;

        sforceX += diff.x * (1/Math.pow(dist,2));
        sforceY += diff.y * (1/Math.pow(dist,2));
        sforceZ += diff.z * (1/Math.pow(dist,2));

      }
    }

    let addition = new THREE.Vector3( inx, iny, inz );
    if (n != 0) {
      addition.sub(separation( sepForce, sforceX, sforceY, sforceZ));
      addition.add( cohesion( cohForce, cforceX, cforceY, cforceZ, n) );
      addition.add( alignment( aforceX, aforceY, aforceZ, boids.velocity[i]) );
    }
    // console.log(addition);
    boids.accel[i].add( addition );
  }
}


function move() {

  calcChange( 0, 0, 0);

  for (let i = 0; i < count; i++ ) {
    let currAccel = boids.accel[i];
    if ( boids.accelerationLimit ) {
      let c_accel = hypot3( currAccel.x, currAccel.y, currAccel.z );
      if ( c_accel > boids.accelerationLimit ) {
        let ratio = boids.accelerationLimit / c_accel;
        boids.accel[i].multiplyScalar( ratio );
      }
    }

    boids.velocity[i].add( boids.accel[i] );
    let currVel = boids.velocity[i];
    if ( boids.speedLimit ) {
      let c_vel = hypot3( currVel.x, currVel.y, currVel.z );
      if ( c_vel > boids.speedLimit ) {
        let ratio = boids.speedLimit / c_vel;
        boids.velocity[i].multiplyScalar( ratio );
      }
    }
  }

  for (let i = 0; i < count; i++ ) {

    mesh.getMatrixAt( i, matrix );
    position.setFromMatrixPosition( matrix );
    position.add( boids.velocity[i] );
    position.set(
      mod(position.getComponent(0) , slen),
      mod(position.getComponent(1) , slen),
      mod(position.getComponent(2) , slen));
    matrix.setPosition( position );
    mesh.setMatrixAt( i, matrix );
    let pInt = getPitchInteger( convertToLatticeInd( position.x, position.y, position.z ) );
    mesh.setColorAt( i, getColor( pInt ) );
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;


     //this is only here bc the bounds don't work well.
    // teleport( i );
    if ( finLoading && ( i < 80 )) {
      mesh.getMatrixAt( i, matrix );
      position.setFromMatrixPosition( matrix );
      let posIndex = convertToLatticeInd( position.x , position.y , position.z );
      if (posIndex < 0 || posIndex > 63999 ) continue
      triggerReceive( i+1, posIndex )
    }
  }
}

/* av,bv - THREE.js vector3 objects
   ml - mod_length
   returns the direction vector from av to bv
   ex. av = [0 0 19], bv = [0 17 5], ml = 20;
    will return: d = [0 -3 6];
*/
function vectorToPeriodic( av, bv, ml) {
  let a = [av.x,av.y,av.z];
  let b = [bv.x,bv.y,bv.z];
  let d = [0,0,0];
  for (let i=0; i<3; i++){
    let opts = [b[i]-a[i], b[i]-(ml+a[i]), (b[i]+ml)-a[i]];
    let dist = ml+1;
    let kdist = 0;
    for (let k=0; k<3; k++){
      if (Math.abs(opts[k]) < dist){
        dist = Math.abs(opts[k]);
        kdist = k;
      }
    }
    d[i] = opts[kdist];
  }
  return new THREE.Vector3(d[0],d[1],d[2]);
}

/*a,b are vectors, and ml is the width of period */
/* returns a positive scalar*/
function distanceToPeriodic( av, bv, ml ) {

  let a = [av.x,av.y,av.z];
  let b = [bv.x,bv.y,bv.z];
  let d = [0,0,0];
  for (let i=0; i<3; i++){
    let opts = [b[i]-a[i], b[i]-(ml+a[i]), (b[i]+ml)-a[i]];
    let dist = ml+1;
    let kdist = 0;
    for (let k=0; k<3; k++){
      if (Math.abs(opts[k]) < dist){
        dist = Math.abs(opts[k]);
        kdist = k;
      }
    }
    d[i] = opts[kdist];
  }
  return hypot3(d[0],d[1],d[2]);
}

//sepForce needs to be from 0 to 1.
function separation( sepForce, sfX, sfY, sfZ, n) {
  return new THREE.Vector3( sepForce*sfX, sepForce*sfY, sepForce*sfZ );
}

function cohesion( cohForce, cfX, cfY, cfZ, n) {
  let addv = new THREE.Vector3( cfX, cfY, cfZ );
  addv.multiplyScalar( cohForce/n );
  return addv;
}

// returns the perpendicular component of the currentVelocity onto the alignment Velocity.
function alignment( afX, afY, afZ, currVel ) {
  let a = new THREE.Vector3( currVel.x, currVel.y, currVel.z );
  let b = new THREE.Vector3( afX,afY,afZ );
  if (hypot3(b.x,b.y,b.z)){
    b.sub( a.multiplyScalar( a.dot(b) / Math.pow(hypot3(a.x,a.y,a.z),2) ) );
  }
  return b;
}

function calcPitchPosGoal( pitch_val ){
  let mcomP = mostCommonPitchInteger();
  let goalind = setPitchGoal( mod(pitch_val+mcomP,12) );

  for( let i=0; i<count; i++){
    let r = getBoidPos( i );

    let totsamples = 10;
    let phi = Math.PI*(3 - Math.pow(5,0.5));
    let rad = eyeDist*2;
    let k = 0, p = 0;
    let found = false;
    let x=0,y=0,z=0,radius=0,theta=0;

    while (found == false){
      y = (1-(k/(totsamples-1)))*2;
      radius = Math.pow(1-y*y,0.5);
      theta = phi*k;
      x = Math.cos(theta)*radius;
      z = Math.sin(theta)*radius;

      x = mod((rad*x)+r.x,slen)
      y = mod((rad*y)+r.y,slen);
      z = mod((rad*y)+r.z,slen);

      p = getPitchInteger( convertToLatticeInd( x, y, z ) );
      k++;
      if (p == goalind){
        found = true;
        boids.goalPos[i] = new THREE.Vector3( x, y, z );
      } else if (k > totsamples) {
        rad = rad*1.1;
        k = 0;
      }
    }
  }
}

function move_withA_goal( pitch_val) {
  // console.log( pitch_val );
  calcPitchPosGoal( pitch_val );
  //
  for (let i = 0; i < count; i++ ) {
    let dir = vectorToPeriodic( getBoidPos( i ), boids.goalPos[i], slen );
    if (hypot3(dir.x,dir.y,dir.z)){
      dir.multiplyScalar( 1/hypot3(dir.x,dir.y,dir.z) );
    }
    calcChange( dir.x,dir.y,dir.z );

    let currAccel = boids.accel[i];
    if ( boids.accelerationLimit ) {
      let c_accel = hypot3( currAccel.x, currAccel.y, currAccel.z );
      if ( c_accel > boids.accelerationLimit ) {
        let ratio = boids.accelerationLimit / c_accel;
        boids.accel[i].multiplyScalar( ratio );
      }
    }

    boids.velocity[i].add( boids.accel[i] );
    let currVel = boids.velocity[i];
    if ( boids.speedLimit ) {
      let c_vel = hypot3( currVel.x, currVel.y, currVel.z );
      if ( c_vel > boids.speedLimit ) {
        let ratio = boids.speedLimit / c_vel;
        boids.velocity[i].multiplyScalar( ratio );
      }
    }
  }

  for (let i = 0; i < count; i++ ) {

    mesh.getMatrixAt( i, matrix );
    position.setFromMatrixPosition( matrix );
    position.add( boids.velocity[i] );
    position.set(
      mod(position.getComponent(0) , slen),
      mod(position.getComponent(1) , slen),
      mod(position.getComponent(2) , slen));
    matrix.setPosition( position );
    mesh.setMatrixAt( i, matrix );
    let pInt = getPitchInteger( convertToLatticeInd( position.x, position.y, position.z ) );
    mesh.setColorAt( i, getColor( pInt ) );
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;

     //this is only here bc the bounds don't work well.
    // teleport( i );
    if ( finLoading && ( i < 190 )) {
      mesh.getMatrixAt( i, matrix );
      position.setFromMatrixPosition( matrix );
      let posIndex = convertToLatticeInd( position.x , position.y , position.z );
      if (posIndex < 0 || posIndex > 63999 ) continue
      triggerReceive( i+1, posIndex );
    }
  }
}

// add this when movement is right
function lookRightDir() {
  let center = boids.velocity[i];
  center.multiplyScalar(-1);
  let up = new THREE.Vector3( position.x, position.y, position.z+1 );
  matrix.lookAt( position, center, up );
}

// to deal with neg mod values. Always outputs a positive number.
function mod(n,m) {
  return ((n%m) + m) %m;
}
// splits the 3d triangle into two hypot.
// supposedly FAST
function hypot3(a, b, c) {
  a = Math.abs(a);
  b = Math.abs(b);
  var lo = Math.min(a, b)
  var hi = Math.max(a, b)
  var ab = hi + 3 * lo / 32 + Math.max(0, 2 * lo - hi) / 8 + Math.max(0, 4 * lo - hi) / 16;

  c = Math.abs(c);
  var lo = Math.min(ab, c)
  var hi = Math.max(ab, c)
  return hi + 3 * lo / 32 + Math.max(0, 2 * lo - hi) / 8 + Math.max(0, 4 * lo - hi) / 16;
}

// directly changes velocity and accel values.
function avoidObstacles( boidIndex ) {

  let b = getBoidPos( boidIndex )

  // if the boid Position is close to the walls
  if ((b.x < divisor || b.x > (slen-divisor)) || (b.y < divisor || b.y > (slen-divisor)) || (b.z < divisor || b.z > (slen-divisor))){
    let withinEyesight = fibonacci_sphere( eyeDist*2, 7, b.x, b.y, b.z);
    let clearPath = 0;
    let i = 0;

    // while there is no viable path found.
    while (clearPath < 1) {
      let val = walls( 0, withinEyesight.x[i] ) + walls( 1, withinEyesight.y[i] ) + walls( 2, withinEyesight.z[i] );
      if (val == 0) {
        clearPath++;
      } else {
        i++;
      }
      if (i == count){
        // console.log(9);
        clearPath = 1;
      }
    }

    let clearPathToTake = new THREE.Vector3( withinEyesight.x[i]-b.x, withinEyesight.y[i]-b.y, withinEyesight.z[i]-b.z );
    let oldMag = boids.accel[boidIndex].length();
    clearPathToTake.normalize;
    boids.accel[ boidIndex ] = clearPathToTake.multiplyScalar( oldMag );
    // boids.accel[ boidIndex ].projectOnVector( clearPathToTake );
    // boids.accel[boidIndex].multiplyScalar(-1);
  }
}

// let old = sepDist;

let tii = 0;
function animate() {
  requestAnimationFrame(animate);
  if (searching == false) {
    move();
  } else {
    move_withA_goal( pitchGoal );
  }
  if (finLoading) {
    vue_det.message = mostCommonPitch();
  }
  stats.update();
  // controls.update();
  render();

}
// init();
// console.log);

function render() {
  renderer.render( scene, camera );
}

// animate(); THIS IS CALLED ONCE DATA IS FINISHED LOADING

//

/* LOADS FILE */

let parts = [];
let points = [];

async function loadFile(url) {
  const req = await fetch(url);
  return req.text();
}

function parseData( text ) {
  //split into lines
  text.split('\n').forEach( (line) => {
    parts.push( line );
  });
  return parts;
};

async function handleData( file ){
  latticePitchContents = await loadFile(file).then(parseData); //to fix later. Surely it's not efficient to have to load and wait everytime for the promise to finish.
  for(let i = 0; i< latticePitchContents.length; i++){
    latticePitchIntegerContents[i] = getPitchInteger(latticePitchContents[i]);
  }
  finLoading = true;
  init();
  animate();
  // move_withA_goal( 5 );
}
handleData('./sept11pValuesByLine.txt')
// init();

// console.log( rand_findPitch( 7 ) );
//

/* Handles above data*/

function getColor( int ) {
  switch(int) {
    case 0:
      return (new THREE.Color( 0xef1011 ));
      break;
    case 1:
      return (new THREE.Color( 0xe67b19 ));
      break;
    case 2:
      return (new THREE.Color( 0xe4d41b ));
      break;
    case 3:
      return (new THREE.Color( 0x7ce718 ));
      break;
    case 4:
      return (new THREE.Color( 0x1de21d ));
      break;
    case 5:
      return( new THREE.Color( 0x1ee192 ));
      break;
    case 6:
      return (new THREE.Color( 0x10efee ));
      break;
    case 7:
      return (new THREE.Color( 0x1984e6 ));
      break;
    case 8:
      return (new THREE.Color( 0x1b2be4 ));
      break;
    case 9:
      return (new THREE.Color( 0x8318e7 ));
      break;
    case 10:
      return (new THREE.Color( 0xe21d32 ));
      break;
    case 11:
      return (new THREE.Color( 0xe11e6d ));
      break;
    case 12:
      return (new THREE.Color( 0xef1011 ));
      break;
    default:
      return (new THREE.Color( 0x002330 ));
  }
}

// cartesian coordinates to array index
function convertToLatticeInd( xpos, ypos, zpos) {
  if (divisor) {
    var xp = Math.round(xpos / divisor);
    var yp = Math.round(ypos / divisor);
    var zp = Math.round(zpos / divisor);
  }
  var ind = (1600*(xp - 1)) + (40*(yp-1)) + zp;
  return ind;
}

function convertToXYZ( latticeInd ) {
  let xpos = Math.floor(latticeInd/1600);
  let ypos = Math.floor((latticeInd % 1600)/40); //this is equivalent to ypos = Math.floor( (latticeInd-(1600*xpos))/40)
  let zpos = Math.floor(latticeInd % 40);
  return new THREE.Vector3( xpos, ypos, zpos );
}

function mostCommonPitch() {
  let mostFrequent = mostCommonPitchInteger();
  let msg = "O";
  switch( mostFrequent ) {
    case 0:
      msg="A";
      break;
    case 1:
      msg="A#";
      break;
    case 2:
      msg="B";
      break;
    case 3:
      msg="C";
      break;
    case 4:
      msg="C#";
      break;
    case 5:
      msg="D";
      break;
    case 6:
      msg="D#";
      break;
    case 7:
      msg="E";
      break;
    case 8:
      msg="F";
      break;
    case 9:
      msg="F#";
      break;
    case 10:
      msg="G";
      break;
    case 11:
      msg="G#";
      break;
    case 12:
      msg="A";
  }
  return msg;
}

function mostCommonPitchInteger() {
  let tempArr = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
  for (let i=0; i<count; i++) {
    let p = getBoidPos(i);
    let posInd = convertToLatticeInd( p.x, p.y, p.z );
    let val = latticePitchContents[posInd]; //The output is between 0 and 1.
    switch(Math.round(val*12)) {
      case 0:
        tempArr[0]++;
        break;
      case 1:
        tempArr[1]++;
        break;
      case 2:
        tempArr[2]++;
        break;
      case 3:
        tempArr[3]++;
        break;
      case 4:
        tempArr[4]++;
        break;
      case 5:
        tempArr[5]++;
        break;
      case 6:
        tempArr[6]++;
        break;
      case 7:
        tempArr[7]++;
        break;
      case 8:
        tempArr[8]++;
        break;
      case 9:
        tempArr[9]++;
        break;
      case 10:
        tempArr[10]++;
        break;
      case 11:
        tempArr[11]++;
        break;
      case 12:
        tempArr[0]++;
    }
  }
  let mostFrequent = 0;
  for (let i=0; i<tempArr.length; i++){
    if (tempArr[i] > tempArr[mostFrequent]) {
      mostFrequent = i;
    }
  }
  return mostFrequent;
}

function getPitchInteger( latticePitchIndex ) {
  let val = latticePitchContents[latticePitchIndex];
  // console.log(val);
  switch (Math.round(val*12)) {
    case 0:
      return 0;
      break;
    case 1:
      return 1;
      break;
    case 2:
      return 2;
      break;
    case 3:
      return 3;
      break;
    case 4:
      return 4;
      break;
    case 5:
      return 5;
      break;
    case 6:
      return 6;
      break;
    case 7:
      return 7;
      break;
    case 8:
      return 8;
      break;
    case 9:
      return 9;
      break;
    case 10:
      return 10;
      break;
    case 11:
      return 11;
      break;
    case 12:
      return 0;
  }
}

/* WEBPD */

// sends to pureData
function triggerReceive( boidIndex, posIndex ) {
  if (listening){
    var freq = latticePitchContents[posIndex];
    freq = Math.pow(2,freq) * 220;
    freq = boids.partial[boidIndex]*(freq * Math.pow(2,boids.octave[boidIndex]));
    let val = parseFloat(freq);
    if (boidIndex == 1 ){
      // console.log(val)
    }
    let receiver = 'num' + boidIndex.toString();
    Pd.send( receiver , [val] );
  } else {
    
  }
}


/* This is the box muller transformation from a uniform dist to a normal dist*/
// opt - 1: normal dist, 0: uniform dist.
// scale - real numbers, ex. 4, you'll get a number from -4 to 4.
// round - 1: should results be integers, 0: real numbers
function assignDist( opt, scale, round ) {
  if (opt) {
    return bmt( scale, round );
  } else {
    return Math.round(Math.random()*scale);
  }
}

function bmt( scale, round) {
  let u1 = Math.random();
  let u2 = Math.random();

  let z0 = Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2);
  // z1 = Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.pi*u2);

  return Math.round(z0*scale);
}
