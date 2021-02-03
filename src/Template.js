/* Babylon JS is available as **npm** package.  
You can easily build a simple `React` Component around a `canvas` and Babylon JS
I have created a minimal example with React+ Babylon:
 */
import React, { Component } from "react";
import * as BABYLON from "babylonjs";
import { AdvancedDynamicTexture, Rectangle, TextBlock } from "babylonjs-gui";
import {
  addBorder,
  addGround,
  createGroundFromPerlinNoise,
  createGroundFromHeightMap,
  addSkyBox,
  addPhotoSphere,
  attachRayOnMesh,
  attachSmokeToMesh,
  addLensFlare
} from "./Helper";
import * as Loader from "babylonjs-loaders";
import SimplexNoise from "simplex-noise";
import Stats from "stats-js";
import Player from "./Player";
const GROUND_SIZE = 30;
const VELOCITY = 50;
let xZoom = 50;
let yZoom = 50;
let noiseStrength = 15.5;
let simplex = new SimplexNoise(4);
//---------------------------

//cache of materials
var materialMap = new Map();
//fps stats
var statsFPS = new Stats();
statsFPS.domElement.style.cssText = "position:absolute;top:3px;left:3px;";
statsFPS.showPanel(0); // 0: fps,
// Keyboard events
var patches = [];
//memory stats
var statsMemory = new Stats();
statsMemory.showPanel(2); //2: mb, 1: ms, 3+: custom
statsMemory.domElement.style.cssText = "position:absolute;top:3px;left:84px;";

var scene, camera;
var boxMesh, groundMesh, robotMesh;

var shadowGenerator; //shadows
var advancedTexture; //GUI
var animations; //GLTF animations

//Track of state
var lastClickedMesh = null;
var currentAnimation = 0;
/**
 * Example temnplate of using Babylon JS with React
 */
class BabylonScene extends Component {
  constructor(props) {
    super(props);
    this.state = {
      useAmmo: false,
      useWireFrame: false,
      shootEnable: true,
      impactEnable: false,
      borderEnable: true,
      shouldAnimate: false,
      shootArrow: true
    };
  }

  componentDidMount = () => {
    // start ENGINE
    this.engine = new BABYLON.Engine(this.canvas, true);

    //Create Scene
    scene = new BABYLON.Scene(this.engine);

    //create Physics Engine
    if (this.state.useAmmo) {
      scene.enablePhysics(
        new BABYLON.Vector3(0, -9.8, 0),
        new BABYLON.AmmoJSPlugin()
      );
    } else {
      //create Physics Engine
      scene.enablePhysics(
        new BABYLON.Vector3(0, -9.8, 0),
        new BABYLON.CannonJSPlugin()
      );
    }

    //Add GUI
    advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("myUI");

    //--Light---
    this.addLight();

    //--Camera---
    this.addCamera();

    //--Ground Normal---
    //addGround();

    //Ground From HeightMap
    groundMesh = createGroundFromHeightMap(
      "textures/earth.jpg",
      "./textures/worldHeightMap.jpg"
    );

    //ground from Noise
    //  groundMesh = createGroundFromPerlinNoise("./textures/concrete/", scene);

    //-- SKY---
    //SkyBox from Panorama
    // addPhotoSphere("assets/skybox.jpeg", scene);

    //Skybox from Cube texture
    addSkyBox("skybox/skybox", scene);

    if (this.state.borderEnable) addBorder(scene, false);

    //--Meshes---
    this.addModels();

    //add Smoke
    attachSmokeToMesh(boxMesh, scene);

    //-------AddPlayer--------
    this.loadModel("Robot.glb");
    var sphere = BABYLON.Mesh.CreateSphere("sphere", 16, 1, scene);
    sphere.position.y = 10;
    var angle = 0;
    //Animation
    scene.registerBeforeRender(() => {
      //Reset if out of bound
      scene.meshes.forEach(mesh => {
        if (mesh.position.y < 0) {
          if (mesh.name === "s") {
            mesh.position.y = 1;
            mesh.position.x = Math.random() * GROUND_SIZE - GROUND_SIZE / 2;
            mesh.position.z = Math.random() * GROUND_SIZE - GROUND_SIZE / 2;
            mesh.physicsImpostor.setLinearVelocity(BABYLON.Vector3.Zero());
            mesh.physicsImpostor.setAngularVelocity(BABYLON.Vector3.Zero());
          } else if (mesh.name === "Arrow") {
            mesh.dispose();
          }
        }
      });

      sphere.position.x = 10 * Math.cos(angle);
      sphere.position.z = 10 * Math.sin(angle);

      angle += 0.01;

      // Casting a ray to get height
      var ray = new BABYLON.Ray(
        new BABYLON.Vector3(
          sphere.position.x,
          groundMesh.getBoundingInfo().boundingBox.maximumWorld.y + 1,
          sphere.position.z
        ),
        new BABYLON.Vector3(0, -1, 0)
      ); // Direction
      var worldInverse = new BABYLON.Matrix();

      groundMesh.getWorldMatrix().invertToRef(worldInverse);

      ray = BABYLON.Ray.Transform(ray, worldInverse);

      var pickInfo = groundMesh.intersects(ray);

      if (pickInfo.hit) {
        sphere.position.y = pickInfo.pickedPoint.y + 0.5;
      }

      //update stats
      statsFPS.update();
      statsMemory.update();
    });

    //-------Allow Patches--------
    var patchMaterial = new BABYLON.StandardMaterial("decalMat", scene);
    patchMaterial.diffuseTexture = new BABYLON.Texture(
      "/textures/impact.png",
      scene
    );
    patchMaterial.diffuseTexture.hasAlpha = true;
    patchMaterial.zOffset = -2;

    var onPointerDown = evt => {
      if (evt.button !== 0) {
        return;
      }
      // check if we are under a mesh
      var pickInfo = scene.pick(scene.pointerX, scene.pointerY, mesh => {
        return true; //mesh === cube;
      });

      if (pickInfo.hit) {
        // Remove old Patches
        if (patches.length > 10) {
          patches.shift().dispose();
        }

        // add New Patch
        var patch = BABYLON.MeshBuilder.CreateDecal(
          "decal",
          pickInfo.pickedMesh,
          {
            position: pickInfo.pickedPoint,
            normal: pickInfo.getNormal(true),
            size: new BABYLON.Vector3(0.7, 0.7, 0.7)
          }
        );
        patch.material = patchMaterial;
        patches.push(patch);
      }
    };

    // -------Picking Objects-------
    var h1 = new BABYLON.HighlightLayer("hl", scene);
    scene.onPointerObservable.add(evt => {
      // Shoot new Ball
      if (
        this.state.shootEnable &&
        evt.type === BABYLON.PointerEventTypes.POINTERDOWN
      ) {
        let position = evt.pickInfo.ray.origin;
        let velocity = evt.pickInfo.ray.direction.scale(VELOCITY);
        if (this.state.shootArrow) {
          this.shootArrow(position, velocity, evt.pickInfo.pickedPoint);
        } else {
          this.shootBullet(position, velocity);
        }
      }

      // Apply Impulse if Highlighted
      if (evt.pickInfo.hit && evt.pickInfo.pickedMesh !== undefined) {
        let mesh = evt.pickInfo.pickedMesh;
        if (mesh && mesh.name === "s") {
          if (lastClickedMesh) {
            h1.removeMesh(lastClickedMesh);
          }
          lastClickedMesh = mesh;
          h1.addMesh(lastClickedMesh, BABYLON.Color3.Green());

          mesh.applyImpulse(
            new BABYLON.Vector3(
              Math.random() * 37,
              Math.random() * 37,
              Math.random() * 37
            ),
            mesh.position
          );
        }
      }
    }, BABYLON.PointerEventTypes.POINTERDOWN);

    //add stats for FPS and Memory usage
    document.body.appendChild(statsFPS.dom);
    document.body.appendChild(statsMemory.dom);

    // Add Events
    window.addEventListener("resize", this.onWindowResize, false);
    this.canvas.addEventListener("pointerdown", onPointerDown, false);

    // Remove EVents
    scene.onDispose = () => {
      this.canvas.removeEventListener("pointerdown", onPointerDown);
    };

    // Render Loop
    this.engine.runRenderLoop(() => {
      scene.render();
    });
  };

  loadMaterial = texture => {
    if (materialMap.has(texture)) {
      return materialMap.get(texture);
    } else {
      let material = new BABYLON.StandardMaterial("cover", scene);
      material.diffuseTexture = new BABYLON.Texture(texture);
      materialMap.set(texture, material);
      return material;
    }
  };

  loadModel = modelUrl => {
    BABYLON.SceneLoader.ImportMesh(
      "",
      "./models/",
      modelUrl,
      scene,
      (newMeshes, particleSystems, skeletons, animationGroups) => {
        robotMesh = newMeshes[0];
        robotMesh.parent = boxMesh;
        robotMesh.position.y = -2;
        var skeleton = skeletons[0];
        animations = animationGroups;
        console.log(animations.length);
      }
    );
  };

  playAnimation = (nextAnimation, repeat) => {
    if (currentAnimation !== nextAnimation) {
      if (animations[nextAnimation]) {
        animations[currentAnimation].stop();
        animations[nextAnimation].start(repeat);
        currentAnimation = nextAnimation;
      }
    }
  };

  /**
   * Add Lights
   */
  addLight = () => {
    //---------- LIGHT---------------------
    //Create a basic light, aiming 0,1,0 - meaning, to the sky.
    var ambientLight = new BABYLON.PointLight(
      "light1",
      new BABYLON.Vector3(0, 10, 0),
      scene
    );
    shadowGenerator = new BABYLON.ShadowGenerator(1024, ambientLight);
    shadowGenerator.setDarkness(0.5);
    shadowGenerator.usePoissonSampling = true;

    ambientLight.intensity = 1.7;
    var lightImpostor = BABYLON.Mesh.CreateSphere("sun", 16, 0.5, scene);
    var lightImpostorMat = new BABYLON.StandardMaterial("mat", scene);
    lightImpostor.material = lightImpostorMat;
    lightImpostorMat.emissiveColor = BABYLON.Color3.Yellow();
    lightImpostorMat.linkEmissiveWithDiffuse = true;
    lightImpostor.parent = ambientLight;

    addLensFlare(ambientLight, scene);
  };

  /**
   * Add Camera
   */
  addCamera = () => {
    // ---------------ArcRotateCamera or Orbit Control----------
    camera = new BABYLON.ArcRotateCamera(
      "Camera",
      Math.PI / 2,
      Math.PI / 4,
      4,
      BABYLON.Vector3.Zero(),
      scene
    );
    camera.inertia = 0;
    camera.angularSensibilityX = 250;
    camera.angularSensibilityY = 250;

    // This attaches the camera to the canvas
    camera.attachControl(this.canvas, true);
    camera.setPosition(new BABYLON.Vector3(5, 5, 5));
  };

  /**
   * Add Models
   */
  addModels = () => {
    // Add BOX
    boxMesh = BABYLON.MeshBuilder.CreateBox(
      "s",
      { height: 4, width: 3, depth: 1.5 },
      scene
    );
    boxMesh.position.y = 1;

    var woodMaterial = new BABYLON.StandardMaterial("wood", scene);
    woodMaterial.diffuseTexture = new BABYLON.Texture(
      "./assets/portal_cube.png",
      scene
    );
    woodMaterial.wireframe = true;
    boxMesh.material = woodMaterial;
    boxMesh.physicsImpostor = new BABYLON.PhysicsImpostor(
      boxMesh,
      BABYLON.PhysicsImpostor.BoxImpostor,
      { mass: 1, friction: 1, restitution: 0.5 },
      scene
    );
    this.addLabelToMesh(boxMesh, "Hello");

    shadowGenerator.addShadowCaster(boxMesh);
  };

  /**
   * Shoot  a ball in direction  of ray
   */
  shootBullet = (position, velocity) => {
    var ballMesh = BABYLON.Mesh.CreateSphere("s", 8, 2, scene);
    ballMesh.position = position;
    ballMesh.material = this.loadMaterial("./textures/ball.png");
    ballMesh.position.copyFrom(position);
    //PHysics
    ballMesh.physicsImpostor = new BABYLON.PhysicsImpostor(
      ballMesh,
      BABYLON.PhysicsImpostor.SphereImpostor,
      { mass: 0.5, restitution: 2.2 },
      scene
    );
    ballMesh.physicsImpostor.setLinearVelocity(velocity);
    shadowGenerator.addShadowCaster(ballMesh);

    // var fire = scene.beginAnimation(akm, 0, 5, false);
    // shoot.play();
  };

  shootArrow = (position, velocity, lookAt) => {
    let woodMaterial = new BABYLON.StandardMaterial("cover", scene);
    woodMaterial.diffuseTexture = new BABYLON.Texture(
      "./assets/texture/crate.gif"
    );

    var tipMaterial = new BABYLON.StandardMaterial("mat1", scene);
    tipMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    tipMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);

    // Add Arrow Tip
    var tipMesh = BABYLON.MeshBuilder.CreateCylinder(
      //BABYLON.Mesh.CreateSphere("s", 8, 4, scene);
      "Arrow",
      { diameterTop: 0, tessellation: 4 },
      scene
    );
    tipMesh.material = tipMaterial;
    tipMesh.position = position;

    // Arrow Body
    var arrowBodyMesh = BABYLON.MeshBuilder.CreateCylinder(
      "cone",
      { diameterTop: 0.2, diameterBottom: 0.2, height: 5, tessellation: 4 },
      scene
    );
    arrowBodyMesh.parent = tipMesh;
    arrowBodyMesh.position.y = -2.5;
    arrowBodyMesh.material = woodMaterial;

    // Add Fins
    var box1 = BABYLON.MeshBuilder.CreateBox(
      "arm",
      { width: 0.3, depth: 0.1, height: 2 },
      scene
    );
    box1.parent = arrowBodyMesh;
    box1.position.x = 0.3;
    box1.position.y = -3;

    let box2 = box1.clone("tooth2");
    box2.position.x = -0.3;
    box2.position.y = -3;

    let box3 = box1.clone("tooth3");
    box3.position.x = 0;
    box3.position.z = 0.3;
    box3.position.y = -3;
    box3.rotation.y = Math.PI / 2;

    let box4 = box3.clone("tooth4");
    box4.position.y = -3;
    box4.position.z = -0.3;

    // PHYSICS
    tipMesh.physicsImpostor = new BABYLON.PhysicsImpostor(
      tipMesh,
      BABYLON.PhysicsImpostor.SphereImpostor,
      { mass: 5, restitution: 0.2 },
      scene
    );

    arrowBodyMesh.physicsImpostor = new BABYLON.PhysicsImpostor(
      arrowBodyMesh,
      BABYLON.PhysicsImpostor.BoxImpostor,
      { mass: 0 }
    );

    [box1, box2, box3, box4].forEach(mesh => {
      mesh.physicsImpostor = new BABYLON.PhysicsImpostor(
        mesh,
        BABYLON.PhysicsImpostor.BoxImpostor,
        { mass: 0 }
      );
    });
    // Rotaton in Direction of Shoot
    tipMesh.lookAt(lookAt);
    tipMesh.physicsImpostor.setLinearVelocity(velocity);
    tipMesh.rotate(BABYLON.Axis.X, Math.PI / 2, BABYLON.Space.LOCAL);

    // Merge Meshes
    // var arrowMesh = BABYLON.Mesh.MergeMeshes(
    //   [tipMesh, box1, box2, box3, box4, arrowBodyMesh],
    //   true,
    //   true,
    //   undefined,
    //   false,
    //   true
    // );
    attachRayOnMesh(tipMesh, scene);
  };

  addLabelToMesh = (mesh, text) => {
    var rect1 = new Rectangle();
    rect1.width = "70px";
    rect1.height = "27px";
    rect1.cornerRadius = 20;
    rect1.color = "black";
    rect1.thickness = 1;
    rect1.background = "white";
    advancedTexture.addControl(rect1);

    var label = new TextBlock();
    label.text = text;
    label.fontSize = "15px";
    rect1.addControl(label);

    rect1.linkWithMesh(mesh);
    rect1.linkOffsetY = -50;
  };

  componentWillUnmount() {
    window.removeEventListener("resize", this.onWindowResize, false);
  }

  onWindowResize = event => {
    this.engine.resize();
  };

  render() {
    return (
      <canvas
        style={{ width: window.innerWidth, height: window.innerHeight }}
        ref={canvas => {
          this.canvas = canvas;
        }}
      />
    );
  }
}
export default BabylonScene;
